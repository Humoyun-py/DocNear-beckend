import re
from datetime import time
import pytest
from .helpers import data, error, authenticate, booking
from .conftest import payload

pytestmark = pytest.mark.django_db


def test_full_booking_flow_with_real_jwt(world):
    """Every platform reads the same ID and updated status, using real login tokens."""
    from rest_framework.test import APIClient
    clients = {}
    for role, account in [("patient", world.patient), ("other", world.other), ("doctor", world.doctor_user),
                          ("owner", world.owner), ("admin", world.admin), ("super_admin", world.superadmin)]:
        client = APIClient()
        tokens = data(client.post("/api/auth/login/", {"email": account.email, "password": "Secure-test-pass42"}))
        assert tokens["access"] and tokens["refresh"]
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        clients[role] = client
    patient = clients["patient"]
    assert data(patient.get("/api/clinics/nearby/", {"latitude": 41.3111, "longitude": 69.2797}))["results"][0]["id"] == world.clinic.pk
    assert data(patient.get(f"/api/clinics/{world.clinic.pk}/"))["doctors"][0]["id"] == world.doctor.pk
    available = data(patient.get(f"/api/doctors/{world.doctor.pk}/availability/", {"date": str(world.day), "clinic_id": world.clinic.pk}))["slots"]
    at = next(s["time"] for s in available if s["available"])
    created = data(patient.post("/api/appointments/", payload(world, at)), 201)
    assert re.fullmatch(r"DN-\d{8}-[A-F0-9]{10}", created["booking_id"])
    assert created["status"] == "pending"
    pk = created["id"]
    assert data(clients["doctor"].get("/api/doctor-panel/appointments/"))["results"][0]["booking_id"] == created["booking_id"]
    data(clients["doctor"].post(f"/api/doctor-panel/appointments/{pk}/accept/"))
    for role, path in [("patient", "appointments"), ("doctor", "doctor-panel/appointments"),
                       ("owner", "clinic-owner/appointments"), ("admin", "admin-panel/appointments"), ("super_admin", "admin-panel/appointments")]:
        shared = data(clients[role].get(f"/api/{path}/{pk}/"))
        assert (shared["booking_id"], shared["status"]) == (created["booking_id"], "confirmed")
    conflict = error(clients["other"].post("/api/appointments/", payload(world, at)), 409)
    assert conflict["code"] == "slot_unavailable"
    assert conflict["message"] == "This appointment time is no longer available."


def test_reschedule_conflict_preserves_original(client, world):
    first = booking(world)
    second = booking(world, time(10), world.other)
    authenticate(client, world.patient)
    error(client.post(f"/api/appointments/{first.pk}/reschedule/", {"date": str(world.day), "time": "10:00"}), 409)
    first.refresh_from_db()
    assert first.start_time == time(9)
    assert second.start_time == time(10)
    assert data(client.get("/api/appointments/my/", {"upcoming": "true"}))["count"] == 1
    assert data(client.get("/api/appointments/my/", {"status": "completed"}))["count"] == 0
    assert data(client.get("/api/appointments/my/", {"cancelled": "true"}))["count"] == 0


@pytest.mark.parametrize("overrides", [{"doctor_id": 999999}, {"clinic_id": 999999}, {"date": "bad"}, {"time": "09:00:01"}, {"time": "25:00"}, {"date": "2020-01-01"}, {"patient_note": "a" * 2001}])
def test_invalid_booking(client, world, overrides):
    authenticate(client, world.patient)
    response = client.post("/api/appointments/", {**payload(world), **overrides})
    error(response, 404 if "doctor_id" in overrides or "clinic_id" in overrides else 400)
