from datetime import timedelta

import pytest
from django.utils import timezone

from .helpers import authenticate, booking, data, error

pytestmark = pytest.mark.django_db


def entry(world, **updates):
    return {"doctor": world.doctor.pk, "clinic": world.clinic.pk,
            "preferred_date": str(world.day), "time_range": "morning", **updates}


def test_waitlist_uses_server_slots_and_duplicate_is_rejected(client, world):
    authenticate(client, world.patient)
    saved = data(client.post("/api/v1/waitlists/", entry(world), format="json"), 201)
    assert saved["available_slot"]["time"] == "09:00"
    booking(world)
    checked = data(client.get(f"/api/v1/waitlists/{saved['id']}/"))
    assert checked["available_slot"]["time"] != "09:00"
    error(client.post("/api/v1/waitlists/", entry(world), format="json"), 400)


def test_waitlist_is_private_and_patient_only(client, world):
    error(client.post("/api/v1/waitlists/", entry(world), format="json"), 401)
    authenticate(client, world.patient)
    saved = data(client.post("/api/v1/waitlists/", entry(world), format="json"), 201)
    authenticate(client, world.other)
    assert data(client.get("/api/v1/waitlists/"))["count"] == 0
    error(client.post(f"/api/v1/waitlists/{saved['id']}/cancel/", {}, format="json"), 404)
    authenticate(client, world.doctor_user)
    error(client.get("/api/v1/waitlists/"), 403)


def test_waitlist_validates_date_clinic_and_booking(client, world):
    authenticate(client, world.patient)
    error(client.post("/api/v1/waitlists/", entry(world, clinic=world.hidden.pk), format="json"), 400)
    error(client.post("/api/v1/waitlists/", entry(world, preferred_date=str(timezone.localdate() - timedelta(days=1))), format="json"), 400)
    saved = data(client.post("/api/v1/waitlists/", entry(world), format="json"), 201)
    url = f"/api/v1/waitlists/{saved['id']}/mark-booked/"
    error(client.post(url, {}, format="json"), 400)
    booking(world)
    assert data(client.post(url, {}, format="json"))["status"] == "booked"


def test_waitlist_cancel_and_rejoin(client, world):
    authenticate(client, world.patient)
    saved = data(client.post("/api/v1/waitlists/", entry(world), format="json"), 201)
    cancelled = data(client.post(f"/api/v1/waitlists/{saved['id']}/cancel/", {}, format="json"))
    assert cancelled["status"] == "cancelled" and cancelled["available_slot"] is None
    data(client.post("/api/v1/waitlists/", entry(world), format="json"), 201)
