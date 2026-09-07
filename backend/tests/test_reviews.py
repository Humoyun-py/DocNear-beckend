import pytest
from apps.appointments.models import Appointment
from apps.reviews.models import Review
from .helpers import authenticate, data, error, booking

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("status", ["pending", "confirmed", "waiting", "in_progress", "cancelled", "rejected", "no_show"])
def test_only_completed_bookings_reviewable(client, world, status):
    a = booking(world)
    Appointment.objects.filter(pk=a.pk).update(status=status)
    authenticate(client, world.patient)
    error(client.post("/api/reviews/", {"appointment": a.pk, "rating": 5}), 400)


def test_review_ownership_and_moderation_delete(client, world):
    a = booking(world)
    Appointment.objects.filter(pk=a.pk).update(status="completed")
    authenticate(client, world.other)
    error(client.post("/api/reviews/", {"appointment": a.pk, "rating": 5}), 404)
    authenticate(client, world.patient)
    error(client.post("/api/reviews/", {"rating": 5}), 400)
    error(client.post("/api/reviews/", {"appointment": a.pk, "rating": 6}), 400)
    review = data(client.post("/api/reviews/", {"appointment": a.pk, "rating": 4, "comment": "Fictional", "is_visible": True}), 201)
    assert review["is_visible"] is False
    authenticate(client, world.other)
    assert data(client.get("/api/reviews/"))["count"] == 0
    authenticate(client, world.admin)
    data(client.get(f"/api/admin-panel/reviews/{review['id']}/"))
    data(client.post(f"/api/admin-panel/reviews/{review['id']}/approve/"))
    world.clinic.refresh_from_db()
    assert world.clinic.rating == 4
    assert client.delete(f"/api/admin-panel/reviews/{review['id']}/").status_code == 204
    world.clinic.refresh_from_db()
    assert world.clinic.rating == 0 and not Review.objects.exists()
