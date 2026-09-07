import pytest
from apps.telegram_support.models import TelegramLink
from .helpers import data, error, authenticate
from .conftest import payload

pytestmark = pytest.mark.django_db


def test_telegram_ownership_and_shared_panels(client, world, settings):
    settings.TELEGRAM_BOT_SECRET = "qa-bot-secret"
    TelegramLink.objects.create(user=world.patient, telegram_user_id=101)
    TelegramLink.objects.create(user=world.other, telegram_user_id=202)
    headers = {"HTTP_X_TELEGRAM_BOT_SECRET": "qa-bot-secret", "HTTP_X_TELEGRAM_USER_ID": "101"}
    for endpoint, params in [("search/", {"q": "kardi"}), ("clinics/nearby/", {"latitude": 41.31, "longitude": 69.28}),
                             (f"doctors/{world.doctor.pk}/availability/", {"date": str(world.day), "clinic_id": world.clinic.pk})]:
        data(client.get("/api/telegram/" + endpoint, params))
    appointment = data(client.post("/api/telegram/appointments/", payload(world), **headers), 201)
    other_headers = {**headers, "HTTP_X_TELEGRAM_USER_ID": "202"}
    error(client.get(f"/api/telegram/appointments/by-booking-id/{appointment['booking_id']}/", **other_headers), 404)
    error(client.post(f"/api/telegram/appointments/{appointment['id']}/cancel/", **other_headers), 404)
    for actor, prefix in [(world.admin, "admin-panel"), (world.doctor_user, "doctor-panel"), (world.owner, "clinic-owner")]:
        authenticate(client, actor)
        assert data(client.get(f"/api/{prefix}/appointments/{appointment['id']}/"))["booking_id"] == appointment["booking_id"]
    client.credentials()
    data(client.post(f"/api/telegram/appointments/{appointment['id']}/reschedule/", {"date": str(world.day), "time": "10:00"}, **headers))
    error(client.get("/api/telegram/appointments/my/", **{**headers, "HTTP_X_TELEGRAM_BOT_SECRET": "wrong"}), 401)
    authenticate(client, world.patient)
    assert client.delete("/api/telegram/link-code/").status_code == 204
    client.credentials()
    error(client.get("/api/telegram/appointments/my/", **headers), 401)
