import pytest
from apps.doctors.models import DoctorClinic
from apps.specialties.models import Specialty
from .helpers import data, error

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("field", ["is_verified", "is_active"])
def test_doctor_public_flags(client, world, field):
    setattr(world.doctor, field, False)
    world.doctor.save()
    assert data(client.get("/api/doctors/"))["count"] == 0
    error(client.get(f"/api/doctors/{world.doctor.pk}/"), 404)


def test_filters_details_and_nearby(client, world):
    for params in [{"specialty": world.specialty.pk}, {"clinic": world.clinic.pk}, {"search": "doctor"}, {"rating": 0}]:
        assert data(client.get("/api/doctors/", params))["count"] == 1
    assert data(client.get("/api/doctors/", {"rating": 5}))["count"] == 0
    result = data(client.get(f"/api/doctors/{world.doctor.pk}/"))
    assert {"name", "bio", "experience_years", "affiliations", "accepts_bookings"} <= result.keys()
    assert not {"user", "pending_profile", "email", "phone_number"} & result.keys()
    assert result["affiliations"][0]["specialty"] == world.specialty.pk
    near = data(client.get("/api/doctors/nearby/", {"latitude": 41.3111, "longitude": 69.2797}))
    assert near["count"] == 1 and near["results"][0]["distance_km"] < 0.01
    error(client.get("/api/doctors/999999/"), 404)
    error(client.get("/api/doctors/nearby/", {}), 400)


def test_hidden_affiliations_cannot_match_filters_or_search(client, world):
    hidden_specialty = Specialty.objects.create(name="Secret specialty", slug="secret")
    DoctorClinic.objects.create(doctor=world.doctor, clinic=world.hidden, specialty=hidden_specialty)
    # An otherwise-public doctor must not reveal affiliation with an unpublished clinic.
    assert data(client.get("/api/doctors/", {"clinic": world.hidden.pk}))["count"] == 0
    assert data(client.get("/api/doctors/", {"specialty": hidden_specialty.pk}))["count"] == 0
    assert data(client.get("/api/doctors/", {"search": "Secret specialty"}))["count"] == 0
    assert data(client.get("/api/search/", {"q": "Secret specialty"}))["doctors"] == []


def test_inactive_user_and_clinic_hide_doctor(client, world):
    world.doctor_user.is_active = False
    world.doctor_user.save()
    assert data(client.get("/api/doctors/"))["count"] == 0
    world.doctor_user.is_active = True
    world.doctor_user.save()
    world.clinic.is_active = False
    world.clinic.save()
    assert data(client.get("/api/doctors/"))["count"] == 0
