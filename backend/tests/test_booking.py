from concurrent.futures import ThreadPoolExecutor
from datetime import time, timedelta
from threading import Barrier
import pytest
from django.db import close_old_connections, IntegrityError, transaction
from apps.appointments.models import Appointment
from apps.appointments.services import create_booking
from apps.schedules.models import DoctorBreak
from apps.doctors.models import DoctorClinic
from apps.schedules.models import DoctorSchedule
from common.exceptions import Conflict
from .conftest import payload

pytestmark = pytest.mark.django_db


def test_availability_booking_cancel_reschedule(client, world):
    client.force_authenticate(world.patient)
    response = client.get(f"/api/doctors/{world.doctor.pk}/availability/", {"date": str(world.day), "clinic_id": world.clinic.pk})
    assert response.status_code == 200, response.data
    assert response.json()["data"]["slots"][0]["available"]
    response = client.post("/api/appointments/", {**payload(world), "patient_id": world.other.pk})
    assert response.status_code == 201, response.data
    booking = response.json()["data"]
    assert booking["patient"] == world.patient.pk and booking["booking_id"].startswith("DN-")
    assert client.post("/api/appointments/", payload(world)).status_code == 409
    assert client.post(f"/api/appointments/{booking['id']}/reschedule/", {"date": str(world.day), "time": "10:00"}).status_code == 200
    assert client.post(f"/api/appointments/{booking['id']}/cancel/", {"reason": "Unavailable"}).status_code == 200
    assert client.post(f"/api/appointments/{booking['id']}/cancel/", {}).status_code == 409
    assert client.post("/api/appointments/", payload(world, "10:00")).status_code == 201


def test_break_buffer_and_conflicting_block(client, world):
    world.relation.buffer_time = 10
    world.relation.save()
    DoctorBreak.objects.create(doctor=world.doctor, clinic=world.clinic, date=world.day, start_time=time(10), end_time=time(11))
    client.force_authenticate(world.patient)
    assert client.post("/api/appointments/", payload(world, "09:40")).status_code == 409
    booking = client.post("/api/appointments/", payload(world)).json()["data"]
    client.force_authenticate(world.doctor_user)
    block = {"clinic": world.clinic.pk, "start_datetime": f"{world.day}T09:10:00+05:00", "end_datetime": f"{world.day}T09:20:00+05:00"}
    assert client.post("/api/doctor-panel/blocked-times/", block).status_code == 409
    change = {"schedules": [{"clinic": world.clinic.pk, "day_of_week": world.day.weekday(), "start_time": "10:00", "end_time": "17:00", "is_working": True}]}
    assert client.patch("/api/doctor-panel/schedule/", change, format="json").status_code == 409
    assert Appointment.objects.get(pk=booking["id"]).start_time == time(9)


@pytest.mark.parametrize("field", ["is_verified", "is_active", "accepts_bookings"])
def test_doctor_booking_flags(client, world, field):
    setattr(world.doctor, field, False)
    world.doctor.save()
    client.force_authenticate(world.patient)
    assert client.post("/api/appointments/", payload(world)).status_code == 409


@pytest.mark.parametrize("field", ["is_verified", "is_active", "is_partner"])
def test_clinic_booking_flags(client, world, field):
    setattr(world.clinic, field, False)
    world.clinic.save()
    client.force_authenticate(world.patient)
    assert client.post("/api/appointments/", payload(world)).status_code == 409


def test_database_excludes_overlaps(world):
    appointment = create_booking(world.patient, doctor_id=world.doctor.pk, clinic_id=world.clinic.pk, date=world.day, time=time(9))
    appointment.pk = None
    appointment.booking_id = "DN-CONSTRAINT-TEST"
    appointment.starts_at += timedelta(minutes=15)
    with pytest.raises(IntegrityError), transaction.atomic():
        appointment.save(force_insert=True)


@pytest.mark.django_db(transaction=True)
def test_concurrent_double_booking(world):
    barrier = Barrier(2)
    def attempt():
        close_old_connections()
        barrier.wait(timeout=10)
        try:
            create_booking(world.patient, doctor_id=world.doctor.pk, clinic_id=world.clinic.pk, date=world.day, time=time(9))
            return "created"
        except Conflict:
            return "conflict"
        finally:
            close_old_connections()
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: attempt(), range(2)))
    assert sorted(results) == ["conflict", "created"]
    assert Appointment.objects.count() == 1


def test_cross_clinic_overlap(world):
    world.hidden.is_partner = world.hidden.is_verified = True
    world.hidden.save()
    DoctorClinic.objects.create(doctor=world.doctor, clinic=world.hidden, specialty=world.specialty)
    DoctorSchedule.objects.create(doctor=world.doctor, clinic=world.hidden, day_of_week=world.day.weekday(), start_time=time(9), end_time=time(17))
    create_booking(world.patient, doctor_id=world.doctor.pk, clinic_id=world.clinic.pk, date=world.day, time=time(9))
    with pytest.raises(Conflict):
        create_booking(world.other, doctor_id=world.doctor.pk, clinic_id=world.hidden.pk, date=world.day, time=time(9))
