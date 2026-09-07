from datetime import timedelta
from unittest.mock import patch
import pytest
from apps.appointments.models import AppointmentEvent
from apps.schedules.models import DoctorBreak, BlockedTime
from .helpers import booking, authenticate, data, error

pytestmark = pytest.mark.django_db


def test_doctor_reads_and_profile_review(client, world):
    appointment = booking(world)
    authenticate(client, world.doctor_user)
    for path in ["dashboard/", "analytics/", "appointments/", "schedule/", "profile/", "profile/preview/", "patients/", "clinics/", f"patients/{world.patient.pk}/"]:
        data(client.get("/api/doctor-panel/" + path))
    result = data(client.patch("/api/doctor-panel/profile/", {"bio": "Updated bio", "education": "Fictional qualification", "is_verified": False}, format="json"))
    assert result["bio"] == "Updated bio" and result["is_verified"] is True
    assert result["education"] == "" and result["pending_profile"]["education"] == "Fictional qualification"
    preview = data(client.get("/api/doctor-panel/profile/preview/"))
    assert "pending_profile" not in preview and preview["education"] == ""
    assert data(client.get("/api/doctor-panel/appointments/", {"booking_id": appointment.booking_id}))["count"] == 1


def test_complete_status_flow(client, world):
    appointment = booking(world)
    authenticate(client, world.doctor_user)
    prefix = f"/api/doctor-panel/appointments/{appointment.pk}/"
    assert data(client.post(prefix + "accept/"))["status"] == "confirmed"
    with patch("apps.appointments.services.timezone.now", return_value=appointment.starts_at + timedelta(minutes=1)):
        for action, expected in [("waiting", "waiting"), ("start", "in_progress"), ("complete", "completed")]:
            assert data(client.post(prefix + action + "/"))["status"] == expected
    error(client.post(prefix + "cancel/"), 409)
    assert list(AppointmentEvent.objects.filter(appointment=appointment).values_list("to_status", flat=True)) == ["pending", "confirmed", "waiting", "in_progress", "completed"]


def test_start_confirmed_visit(client, world):
    appointment = booking(world)
    authenticate(client, world.doctor_user)
    prefix = f"/api/doctor-panel/appointments/{appointment.pk}/"
    data(client.post(prefix + "accept/"))
    with patch("apps.appointments.services.timezone.now", return_value=appointment.starts_at):
        assert data(client.post(prefix + "start/"))["status"] == "in_progress"


@pytest.mark.parametrize("terminal,invalid", [("cancel", "start"), ("reject", "accept")])
def test_terminal_states_cannot_restart(client, world, terminal, invalid):
    appointment = booking(world)
    authenticate(client, world.doctor_user)
    prefix = f"/api/doctor-panel/appointments/{appointment.pk}/"
    data(client.post(prefix + terminal + "/"))
    error(client.post(prefix + invalid + "/"), 409)


@pytest.mark.parametrize("waiting", [False, True])
def test_no_show(client, world, waiting):
    appointment = booking(world)
    authenticate(client, world.doctor_user)
    prefix = f"/api/doctor-panel/appointments/{appointment.pk}/"
    data(client.post(prefix + "accept/"))
    error(client.post(prefix + "no-show/"), 409)
    with patch("apps.appointments.services.timezone.now", return_value=appointment.starts_at):
        if waiting:
            data(client.post(prefix + "waiting/"))
        assert data(client.post(prefix + "no-show/"))["status"] == "no_show"


def test_schedule_break_and_block_crud(client, world):
    authenticate(client, world.doctor_user)
    schedule = {"schedules": [{"clinic": world.clinic.pk, "day_of_week": 0, "start_time": "10:00", "end_time": "16:00", "is_working": True}],
                "policies": [{"clinic": world.clinic.pk, "consultation_duration": 20, "buffer_time": 5, "max_appointments_per_day": 10}]}
    data(client.patch("/api/doctor-panel/schedule/", schedule, format="json"))
    result = data(client.post("/api/doctor-panel/breaks/", {"clinic": world.clinic.pk, "weekday": 0, "start_time": "12:00", "end_time": "13:00"}), 201)
    assert client.delete(f"/api/doctor-panel/breaks/{result['id']}/").status_code == 204
    result = data(client.post("/api/doctor-panel/blocked-times/", {"clinic": world.clinic.pk, "start_datetime": f"{world.day}T12:00:00+05:00", "end_datetime": f"{world.day}T13:00:00+05:00"}), 201)
    assert client.delete(f"/api/doctor-panel/blocked-times/{result['id']}/").status_code == 204
    assert not DoctorBreak.objects.exists() and not BlockedTime.objects.exists()


@pytest.mark.parametrize("body", [
    {"policies": [{"clinic": "invalid", "buffer_time": 5}]},
    {"policies": [{"clinic": {}, "buffer_time": 5}]},
    {"policies": [{"clinic": 1, "consultation_duration": 0}]},
    {"schedules": [{"clinic": 1, "day_of_week": 8, "start_time": "09:00", "end_time": "17:00"}]},
])
def test_malformed_schedule_returns_validation_error(client, world, body):
    authenticate(client, world.doctor_user)
    client.raise_request_exception = False
    error(client.patch("/api/doctor-panel/schedule/", body, format="json"), 400)
