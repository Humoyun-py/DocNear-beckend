from concurrent.futures import ThreadPoolExecutor
from datetime import time
from threading import Barrier
import pytest
from django.db import close_old_connections
from apps.doctors.models import DoctorProfile, DoctorClinic
from apps.schedules.models import DoctorSchedule
from apps.appointments.models import Appointment
from .helpers import booking, jwt_client, data, error
from .conftest import payload

pytestmark = pytest.mark.django_db


def test_different_times_and_doctors(world):
    booking(world)
    assert data(jwt_client(world.other).post("/api/appointments/", payload(world, "09:30")), 201)["status"] == "pending"
    account = world.user("second-doctor", "doctor")
    doctor = DoctorProfile.objects.create(user=account, is_verified=True)
    DoctorClinic.objects.create(doctor=doctor, clinic=world.clinic, specialty=world.specialty)
    DoctorSchedule.objects.create(doctor=doctor, clinic=world.clinic, day_of_week=world.day.weekday(), start_time=time(9), end_time=time(17))
    assert data(jwt_client(world.other).post("/api/appointments/", {**payload(world), "doctor_id": doctor.pk}), 201)["doctor"] == doctor.pk


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize("operation", ["create", "reschedule"])
def test_two_patients_race_through_http_api(world, operation):
    appointments = [booking(world, time(10), world.patient), booking(world, time(11), world.other)] if operation == "reschedule" else []
    clients = [jwt_client(world.patient), jwt_client(world.other)]
    barrier = Barrier(2)
    def attempt(index):
        close_old_connections()
        try:
            barrier.wait(timeout=10)
            if operation == "create":
                response = clients[index].post("/api/appointments/", payload(world))
            else:
                response = clients[index].post(f"/api/appointments/{appointments[index].pk}/reschedule/", {"date": str(world.day), "time": "09:00"})
            return response.status_code, response.json()
        finally:
            close_old_connections()
    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(attempt, [0, 1]))
    assert sorted(status for status, _ in results) == [201 if operation == "create" else 200, 409]
    assert next(body for status, body in results if status == 409)["code"] == "slot_unavailable"
    assert Appointment.objects.filter(start_time=time(9)).count() == 1


def test_no_reservation_reuse_after_completed_or_no_show(world):
    appointment = booking(world)
    for status in ["completed", "no_show"]:
        appointment.status = status
        appointment.save(update_fields=["status"])
        error(jwt_client(world.other).post("/api/appointments/", payload(world)), 409)
