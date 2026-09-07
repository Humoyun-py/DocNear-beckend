from io import BytesIO
import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.clinics.models import Clinic, ClinicService, ClinicImage
from .helpers import data, error

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("field", ["is_active", "is_verified", "is_partner"])
def test_visibility_every_public_path(client, world, field):
    setattr(world.clinic, field, False)
    world.clinic.save()
    assert data(client.get("/api/clinics/"))["count"] == 0
    assert data(client.get("/api/clinics/nearby/", {"latitude": 41.3111, "longitude": 69.2797}))["count"] == 0
    assert data(client.get("/api/clinics/emergency/"))["count"] == 0
    error(client.get(f"/api/clinics/{world.clinic.pk}/"), 404)


@pytest.mark.parametrize("params", [{}, {"latitude": 41}, {"longitude": 69},
    {"latitude": 91, "longitude": 69}, {"latitude": 41, "longitude": -181},
    {"latitude": 41, "longitude": 69, "radius": -1}, {"latitude": 41, "longitude": 69, "radius": 0},
    {"latitude": 41, "longitude": 69, "radius": 101}, {"latitude": "inf", "longitude": 69},
    {"latitude": 41, "longitude": 69, "radius": "nan"}])
def test_invalid_geo(client, world, params):
    error(client.get("/api/clinics/nearby/", params), 400)


def test_radius_sorting_and_emergency(client, world):
    further = Clinic.objects.create(owner=world.owner, name="Further", slug="further", address="Fictional",
        latitude=41.33, longitude=69.2797, is_partner=True, is_verified=True, is_24_7=True)
    params = {"latitude": world.clinic.latitude, "longitude": world.clinic.longitude, "radius": 5}
    rows = data(client.get("/api/clinics/nearby/", params))["results"]
    assert [r["id"] for r in rows] == [world.clinic.pk, further.pk]
    assert 2 < rows[1]["distance_km"] < 3
    assert data(client.get("/api/clinics/nearby/", {**params, "radius": 1}))["count"] == 1
    assert [r["id"] for r in data(client.get("/api/clinics/emergency/", params))["results"]] == [further.pk]
    # Filters unrelated to coordinates must not turn an unlocated emergency search into a 400.
    assert data(client.get("/api/clinics/emergency/", {"page_size": 10}))["count"] == 1


def test_details_gallery_services_hours(client, world, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    service = ClinicService.objects.create(name="Diagnostics", slug="diagnostics")
    inactive = ClinicService.objects.create(name="Hidden service", slug="hidden-service", is_active=False)
    world.clinic.services.add(service, inactive)
    image = BytesIO()
    Image.new("RGB", (4, 4)).save(image, format="PNG")
    ClinicImage.objects.create(clinic=world.clinic, image=SimpleUploadedFile("test.png", image.getvalue(), "image/png"))
    result = data(client.get(f"/api/clinics/{world.clinic.pk}/"))
    assert len(result["doctors"]) == len(result["services"]) == len(result["images"]) == 1
    assert result["working_hours"] == world.clinic.working_hours
    assert result["doctor_count"] == 1 and result["verified_partner"] is True
    assert "owner" not in result
    assert result["images"][0]["image"].startswith("http")
    error(client.get("/api/clinics/999999/"), 404)
