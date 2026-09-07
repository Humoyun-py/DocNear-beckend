from datetime import time, timedelta
from types import SimpleNamespace
import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.clinics.models import Clinic
from apps.doctors.models import DoctorProfile, DoctorClinic
from apps.specialties.models import Specialty
from apps.schedules.models import DoctorSchedule


@pytest.fixture(autouse=True)
def isolate_throttle_cache():
    from django.core.cache import cache
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def world(db):
    def user(name, role="patient"):
        return User.objects.create_user(email=f"{name}@example.test", password="Secure-test-pass42", first_name=name, role=role)
    patient, other = user("patient"), user("other")
    owner, outsider = user("owner", "clinic_owner"), user("outsider", "clinic_owner")
    admin, superadmin = user("admin", "admin"), user("super", "super_admin")
    doctor_user = user("doctor", "doctor")
    doctor = DoctorProfile.objects.create(user=doctor_user, is_verified=True)
    specialty = Specialty.objects.create(name="Cardiology", slug="cardiology", search_aliases="kardi kardiolog")
    clinic = Clinic.objects.create(owner=owner, name="Demo Clinic", slug="demo", address="Demo address", latitude=41.3111, longitude=69.2797,
                                   is_verified=True, is_partner=True, working_hours={str(i): [["08:00", "18:00"]] for i in range(7)})
    hidden = Clinic.objects.create(owner=outsider, name="Hidden", slug="hidden", address="Hidden", latitude=41.312, longitude=69.279, working_hours=clinic.working_hours)
    relation = DoctorClinic.objects.create(doctor=doctor, clinic=clinic, specialty=specialty)
    day = timezone.localdate() + timedelta(days=1)
    for weekday in range(7):
        DoctorSchedule.objects.create(doctor=doctor, clinic=clinic, day_of_week=weekday, start_time=time(9), end_time=time(17))
    return SimpleNamespace(**locals())


@pytest.fixture
def client():
    return APIClient()


def payload(world, time="09:00"):
    return {"doctor_id": world.doctor.pk, "clinic_id": world.clinic.pk, "date": str(world.day), "time": time}
