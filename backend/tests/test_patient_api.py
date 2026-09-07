import pytest
from apps.appointments.models import Appointment
from apps.reviews.models import Review
from .conftest import payload

pytestmark = pytest.mark.django_db


def test_discovery_search_and_hidden_clinics(client, world):
    nearby = client.get("/api/clinics/nearby/", {"latitude": 41.3111, "longitude": 69.2797}).json()["data"]
    assert nearby["count"] == 1
    assert nearby["results"][0]["distance_km"] < 0.01
    assert client.get(f"/api/clinics/{world.hidden.pk}/").status_code == 404
    assert client.get("/api/clinics/nearby/", {"latitude": "NaN", "longitude": 69}).status_code == 400
    search = client.get("/api/search/", {"q": "kardi"}).json()["data"]
    assert len(search["doctors"]) == len(search["clinics"]) == len(search["specialties"]) == 1
    assert client.get(f"/api/doctors/{world.doctor.pk}/").status_code == 200


def test_favorites_reviews_notifications(client, world):
    client.force_authenticate(world.patient)
    url = f"/api/favorites/doctors/{world.doctor.pk}/"
    assert client.post(url).status_code == 201
    assert client.post(url).status_code == 200
    assert client.get("/api/favorites/doctors/").json()["data"]["count"] == 1
    assert client.delete(url).status_code == 204
    pk = client.post("/api/appointments/", payload(world)).json()["data"]["id"]
    data = {"appointment": pk, "rating": 5, "comment": "Fictional demo review"}
    assert client.post("/api/reviews/", data).status_code == 400
    Appointment.objects.filter(pk=pk).update(status="completed")
    response = client.post("/api/reviews/", data)
    assert response.status_code == 201, response.data
    assert client.post("/api/reviews/", data).status_code == 400
    notification = client.get("/api/notifications/").json()["data"]
    assert notification["unread_count"] == 1
    nid = notification["results"][0]["id"]
    client.force_authenticate(world.other)
    assert client.post(f"/api/notifications/{nid}/read/").status_code == 404
    client.force_authenticate(world.admin)
    review = Review.objects.get(appointment_id=pk)
    assert client.post(f"/api/admin-panel/reviews/{review.pk}/approve/").status_code == 200
    world.doctor.refresh_from_db()
    assert world.doctor.rating == 5 and world.doctor.total_reviews == 1
    assert client.post(f"/api/admin-panel/reviews/{review.pk}/hide/").status_code == 200
    world.doctor.refresh_from_db()
    assert world.doctor.rating == 0


def test_telegram_flow(client, world, settings):
    settings.TELEGRAM_BOT_SECRET = "test-bot-secret"
    client.force_authenticate(world.patient)
    code = client.post("/api/telegram/link-code/").json()["data"]["code"]
    client.force_authenticate(None)
    headers = {"HTTP_X_TELEGRAM_BOT_SECRET": "test-bot-secret", "HTTP_X_TELEGRAM_USER_ID": "12345"}
    assert client.post("/api/telegram/link/", {"code": code, "telegram_user_id": 12345}, **headers).status_code == 200
    assert client.post("/api/telegram/link/", {"code": code, "telegram_user_id": 12345}, **headers).status_code == 404
    response = client.post("/api/telegram/appointments/", payload(world), **headers)
    assert response.status_code == 201, response.data
    booking = response.json()["data"]
    assert client.get(f"/api/telegram/appointments/by-booking-id/{booking['booking_id']}/", **headers).status_code == 200
    assert client.get("/api/telegram/appointments/my/", **headers).json()["data"]["count"] == 1
    assert client.post(f"/api/telegram/appointments/{booking['id']}/cancel/", **headers).status_code == 200
    assert client.get("/api/telegram/appointments/my/").status_code == 401
