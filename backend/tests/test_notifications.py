import pytest
from apps.notifications.models import Notification
from .helpers import authenticate, data, error, booking

pytestmark = pytest.mark.django_db


def test_read_counts_and_filtering(client, world):
    appointment = booking(world)
    authenticate(client, world.patient)
    listing = data(client.get("/api/notifications/"))
    assert listing["count"] == listing["unread_count"] == 1
    notification = listing["results"][0]
    assert notification["related_object_id"] == str(appointment.pk)
    data(client.post(f"/api/notifications/{notification['id']}/read/"))
    assert data(client.get("/api/notifications/"))["unread_count"] == 0
    assert data(client.get("/api/notifications/", {"unread": "true"}))["count"] == 0
    assert data(client.get("/api/notifications/", {"is_read": "true"}))["count"] == 1
    Notification.objects.create(user=world.patient, type="general", title="QA", message="Fictional")
    assert data(client.post("/api/notifications/read-all/"))["updated"] == 1
    authenticate(client, world.other)
    error(client.get(f"/api/notifications/{notification['id']}/"), 404)


@pytest.mark.parametrize("target", ["user_id", "role", "clinic_id", "all"])
def test_admin_send_and_broadcast(client, world, target):
    booking(world)
    authenticate(client, world.admin)
    params = {"title": "QA notice", "message": "Fictional test message"}
    params.update({"user_id": world.patient.pk} if target == "user_id" else {"role": "doctor"} if target == "role" else {"clinic_id": world.clinic.pk} if target == "clinic_id" else {})
    result = data(client.post(f"/api/admin-panel/notifications/{'send' if target == 'user_id' else 'broadcast'}/", params), 201)
    assert result["sent_count"] == (1 if target in {"user_id", "role"} else 3 if target == "clinic_id" else 7)
    messages = Notification.objects.filter(title="QA notice")
    if target == "user_id":
        assert list(messages.values_list("user_id", flat=True)) == [world.patient.pk]
    if target == "role":
        assert list(messages.values_list("user_id", flat=True)) == [world.doctor_user.pk]


def test_invalid_notification_targets(client, world):
    authenticate(client, world.admin)
    error(client.post("/api/admin-panel/notifications/send/", {"title": "QA", "message": "QA"}), 400)
    error(client.post("/api/admin-panel/notifications/broadcast/", {"title": "QA", "message": "QA", "role": "doctor", "clinic_id": world.clinic.pk}), 400)
