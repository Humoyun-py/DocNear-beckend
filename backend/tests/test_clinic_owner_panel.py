import pytest
from .helpers import data, error, authenticate, booking
from apps.clinics.models import ClinicService

pytestmark = pytest.mark.django_db


def test_owner_views_updates_and_services(client, world):
    booking(world)
    authenticate(client, world.owner)
    for endpoint in ["dashboard/", "clinic/", "clinics/", "doctors/", "appointments/", "analytics/", "services/", "schedule/"]:
        data(client.get("/api/clinic-owner/" + endpoint))
    result = data(client.patch("/api/clinic-owner/clinic/", {"name": "Updated owner clinic", "owner": world.outsider.pk, "is_verified": False}))
    assert result["name"] == "Updated owner clinic" and result["is_verified"] is True
    world.clinic.refresh_from_db()
    assert world.clinic.owner_id == world.owner.pk
    service = ClinicService.objects.create(name="QA service", slug="qa-service")
    result = data(client.patch("/api/clinic-owner/services/", {"services": [service.pk]}, format="json"))
    assert result["services"][0]["id"] == service.pk
    error(client.patch(f"/api/clinic-owner/clinic/?clinic_id={world.hidden.pk}", {"name": "Stolen"}), 404)


def test_owner_schedule_change_rolls_back_conflict(client, world):
    booking(world)
    authenticate(client, world.owner)
    error(client.patch("/api/clinic-owner/clinic/", {"working_hours": {str(world.day.weekday()): [["10:00", "17:00"]]}}, format="json"), 409)
    world.clinic.refresh_from_db()
    assert world.clinic.working_hours[str(world.day.weekday())][0][0] == "08:00"
    error(client.patch(f"/api/clinic-owner/doctors/{world.relation.pk}/", {"is_active": False}), 409)
    world.relation.refresh_from_db()
    assert world.relation.is_active is True


def test_owner_rejects_unowned_doctor_creation(client, world):
    authenticate(client, world.owner)
    error(client.post("/api/clinic-owner/doctors/", {"account": {"first_name": "QA", "phone_number": "+998901230003", "email": "bad-owner@example.test"}, "clinic": world.hidden.pk, "specialty": world.specialty.pk}, format="json"), 400)


def test_owner_can_update_own_affiliation(client, world):
    authenticate(client, world.owner)
    result = data(client.patch(f"/api/clinic-owner/doctors/{world.relation.pk}/", {"consultation_duration": 45, "is_verified": True, "doctor": 9999}))
    assert result["consultation_duration"] == 45 and result["doctor_id"] == world.doctor.pk
