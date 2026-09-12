from io import BytesIO
import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.accounts.models import User
from apps.clinics.models import Clinic
from .helpers import authenticate, data, error, booking

pytestmark = pytest.mark.django_db


def test_clinic_lifecycle(client, world):
    authenticate(client, world.admin)
    result = data(client.post("/api/admin-panel/clinics/", {"owner": world.owner.pk, "name": "QA Clinic", "slug": "qa-clinic", "address": "Fictional", "latitude": 41.31, "longitude": 69.28, "working_hours": {"0": [["09:00", "17:00"]]}}, format="json"), 201)
    prefix = f"/api/admin-panel/clinics/{result['id']}/"
    data(client.patch(prefix, {"name": "Updated clinic"}))
    for action, field, value in [("verify", "is_verified", True), ("mark-partner", "is_partner", True), ("disable", "is_active", False), ("enable", "is_active", True), ("remove-partner", "is_partner", False)]:
        assert data(client.post(prefix + action + "/"))[field] is value
    assert data(client.delete(prefix))["is_active"] is False
    assert Clinic.objects.filter(pk=result["id"]).exists()


def test_doctor_lifecycle_and_affiliations(client, world):
    authenticate(client, world.admin)
    result = data(client.post("/api/admin-panel/doctors/", {"account": {"phone_number": "+998901230001", "email": "qa-doctor@example.test", "first_name": "QA"}, "clinic": world.clinic.pk, "specialty": world.specialty.pk}, format="json"), 201)
    prefix = f"/api/admin-panel/doctors/{result['id']}/"
    data(client.patch(prefix, {"bio": "Fictional test profile"}))
    for action, field, expected in [("verify", "is_verified", True), ("suspend", "is_active", False), ("activate", "is_active", True)]:
        assert data(client.post(prefix + action + "/"))[field] is expected
    affiliation = data(client.post("/api/admin-panel/affiliations/", {"doctor": result["id"], "clinic": world.hidden.pk, "specialty": world.specialty.pk}), 201)
    data(client.patch(f"/api/admin-panel/affiliations/{affiliation['id']}/", {"consultation_duration": 45}))
    assert client.delete(f"/api/admin-panel/affiliations/{affiliation['id']}/").status_code == 204
    assert data(client.delete(prefix))["is_active"] is False


@pytest.mark.parametrize("resource", ["specialties", "services"])
def test_catalog_crud_icons(client, world, resource):
    authenticate(client, world.admin)
    endpoint = f"/api/admin-panel/{resource}/"
    result = data(client.post(endpoint, {"name": "QA Specialty", "slug": "qa-specialty", "icon_name": "heart-pulse"}), 201)
    data(client.patch(f"{endpoint}{result['id']}/", {"description": "Fictional test item"}))
    error(client.patch(f"{endpoint}{result['id']}/", {"icon_name": "\U0001f49a"}), 400)
    assert client.delete(f"{endpoint}{result['id']}/").status_code == 204
    assert data(client.get(f"{endpoint}{result['id']}/"))["is_active"] is False


def test_admin_patient_and_booking_access(client, world):
    a = booking(world)
    authenticate(client, world.admin)
    assert data(client.get("/api/admin-panel/appointments/", {"booking_id": a.booking_id}))["count"] == 1
    data(client.get(f"/api/admin-panel/appointments/{a.pk}/"))
    data(client.patch(f"/api/admin-panel/appointments/{a.pk}/", {"status": "confirmed"}))
    data(client.post(f"/api/admin-panel/appointments/{a.pk}/reschedule/", {"date": str(world.day), "time": "11:00"}))
    data(client.post(f"/api/admin-panel/appointments/{a.pk}/cancel/"))
    data(client.get(f"/api/admin-panel/patients/{world.patient.pk}/"))
    data(client.patch(f"/api/admin-panel/patients/{world.patient.pk}/", {"first_name": "Updated"}))
    data(client.post(f"/api/admin-panel/patients/{world.patient.pk}/disable/"))
    assert client.post("/api/auth/login/", {"email": world.patient.email, "password": "Secure-test-pass42"}).status_code == 401
    data(client.post(f"/api/admin-panel/patients/{world.patient.pk}/enable/"))


def test_owner_accounts_settings_and_logs(client, world):
    authenticate(client, world.admin)
    data(client.post("/api/admin-panel/owners/", {"first_name": "New", "phone_number": "+998901230002", "email": "qa-owner@example.test"}), 201)
    error(client.post("/api/admin-panel/owners/", {"first_name": "Duplicate", "phone_number": "+998901230002"}), 400)
    account = User.objects.get(email="qa-owner@example.test")
    assert account.role == "clinic_owner"
    assert account.is_verified and not account.has_usable_password()
    data(client.patch(f"/api/admin-panel/owners/{account.pk}/", {"first_name": "Updated"}))
    data(client.post(f"/api/admin-panel/owners/{account.pk}/disable/"))
    data(client.post(f"/api/admin-panel/owners/{account.pk}/enable/"))
    authenticate(client, world.superadmin)
    data(client.patch("/api/admin-panel/settings/", {"support_email": "support@example.test"}))
    assert data(client.get("/api/admin-panel/settings/"))["support_email"] == "support@example.test"
    assert data(client.get("/api/admin-panel/logs/"))["count"] > 0


def test_image_upload_update_delete(client, world, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    authenticate(client, world.admin)
    stream = BytesIO()
    Image.new("RGB", (4, 4)).save(stream, "PNG")
    result = data(client.post("/api/admin-panel/clinic-images/", {"clinic": world.clinic.pk, "image": SimpleUploadedFile("qa.png", stream.getvalue(), "image/png")}, format="multipart"), 201)
    prefix = f"/api/admin-panel/clinic-images/{result['id']}/"
    data(client.get(prefix))
    assert data(client.patch(prefix, {"order": 5}))["order"] == 5
    assert client.delete(prefix).status_code == 204
    error(client.post("/api/admin-panel/clinic-images/", {"clinic": world.clinic.pk, "image": SimpleUploadedFile("fake.png", b"not-an-image", "image/png")}, format="multipart"), 400)
