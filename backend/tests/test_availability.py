from datetime import time
import pytest
from apps.schedules.models import DoctorBreak, BlockedTime
from apps.schedules.services import local_datetime
from .helpers import data, error, booking, authenticate

pytestmark = pytest.mark.django_db


def slots(client, world):
    return data(client.get(f"/api/doctors/{world.doctor.pk}/availability/", {"date": str(world.day), "clinic_id": world.clinic.pk}))["slots"]


def test_normal_day_day_off_closed_clinic(client, world):
    result = slots(client, world)
    assert len(result) == 16 and all(s["available"] for s in result)
    assert result[0]["time"] == "09:00" and result[-1]["time"] == "16:30"
    world.doctor.schedules.filter(day_of_week=world.day.weekday()).update(is_working=False)
    assert slots(client, world) == []
    world.doctor.schedules.filter(day_of_week=world.day.weekday()).update(is_working=True)
    world.clinic.working_hours = {}
    world.clinic.save()
    assert not any(s["available"] for s in slots(client, world))


def test_breaks_blocks_bookings_and_buffers(client, world):
    world.relation.buffer_time = 10
    world.relation.save()
    DoctorBreak.objects.create(doctor=world.doctor, clinic=world.clinic, weekday=world.day.weekday(), start_time=time(10), end_time=time(11))
    BlockedTime.objects.create(doctor=world.doctor, clinic=world.clinic, start_datetime=local_datetime(world.day, time(12)), end_datetime=local_datetime(world.day, time(13)))
    booking(world)
    result = {s["time"]: s["available"] for s in slots(client, world)}
    assert not result["09:00"] and not result["09:40"] and not result["10:20"]
    assert result["11:00"] and not result["12:20"] and result["13:00"]


def test_daily_limit_and_clinic_hours(client, world):
    world.relation.max_appointments_per_day = 1
    world.relation.save()
    world.clinic.working_hours = {str(world.day.weekday()): [["10:00", "12:00"]]}
    world.clinic.save()
    assert {s["time"] for s in slots(client, world) if s["available"]} == {"10:00", "10:30", "11:00", "11:30"}
    booking(world, time(10))
    assert not any(s["available"] for s in slots(client, world))


@pytest.mark.parametrize("params", [{}, {"date": "bad", "clinic_id": 1}, {"date": "2020-01-01", "clinic_id": 1}, {"date": "2099-01-01", "clinic_id": 1}])
def test_invalid_availability_input(client, world, params):
    error(client.get(f"/api/doctors/{world.doctor.pk}/availability/", params), 400)


def test_unrelated_clinic_and_toggle(client, world):
    world.hidden.is_partner = world.hidden.is_verified = True
    world.hidden.save()
    error(client.get(f"/api/doctors/{world.doctor.pk}/availability/", {"date": str(world.day), "clinic_id": world.hidden.pk}), 404)
    a = booking(world)
    authenticate(client, world.doctor_user)
    data(client.post("/api/doctor-panel/availability/toggle/", {"available": False}, format="json"))
    assert slots(client, world) == []
    assert data(client.get("/api/doctor-panel/appointments/"))["count"] == 1
    assert data(client.get(f"/api/doctor-panel/appointments/{a.pk}/"))["status"] == "pending"


def test_increased_buffer_cannot_overlap_existing_visit(client, world):
    booking(world, time(9))
    booking(world, time(9, 30), patient=world.other)
    authenticate(client, world.doctor_user)
    error(client.patch("/api/doctor-panel/schedule/", {"policies": [{"clinic": world.clinic.pk, "buffer_time": 10}]}, format="json"), 409)
    world.relation.refresh_from_db()
    assert world.relation.buffer_time == 0
