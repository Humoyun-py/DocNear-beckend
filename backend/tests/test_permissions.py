import pytest
from .conftest import payload
from apps.doctors.models import DoctorProfile

pytestmark = pytest.mark.django_db


def test_patient_and_owner_isolation(client, world):
    client.force_authenticate(world.patient)
    pk = client.post("/api/appointments/", payload(world)).json()["data"]["id"]
    client.force_authenticate(world.other)
    assert client.get(f"/api/appointments/{pk}/").status_code == 404
    assert client.post(f"/api/appointments/{pk}/cancel/").status_code == 404
    assert client.get("/api/admin-panel/appointments/").status_code == 403
    assert client.get("/api/doctor-panel/appointments/").status_code == 403
    client.force_authenticate(world.outsider)
    assert client.get("/api/clinic-owner/appointments/").json()["data"]["count"] == 0
    assert client.patch(f"/api/clinic-owner/clinic/?clinic_id={world.clinic.pk}", {"name": "Stolen"}).status_code == 404
    assert client.get(f"/api/clinic-owner/doctors/{world.relation.pk}/").status_code == 404
    client.force_authenticate(world.owner)
    row = client.get("/api/clinic-owner/appointments/").json()["data"]["results"][0]
    assert "patient_note" not in row
    assert client.patch("/api/clinic-owner/clinic/", {"is_partner": False}).status_code == 200
    world.clinic.refresh_from_db()
    assert world.clinic.is_partner


def test_doctor_ownership_and_status_transitions(client, world):
    client.force_authenticate(world.patient)
    pk = client.post("/api/appointments/", payload(world)).json()["data"]["id"]
    other_doctor = world.user("otherdoctor", "doctor")
    DoctorProfile.objects.create(user=other_doctor)
    client.force_authenticate(other_doctor)
    assert client.post(f"/api/doctor-panel/appointments/{pk}/accept/").status_code == 404
    assert client.get(f"/api/doctor-panel/patients/{world.patient.pk}/").status_code == 404
    client.force_authenticate(world.doctor_user)
    assert client.post(f"/api/doctor-panel/appointments/{pk}/accept/").status_code == 200
    assert client.post(f"/api/doctor-panel/appointments/{pk}/accept/").status_code == 409
    assert client.post(f"/api/doctor-panel/appointments/{pk}/complete/").status_code == 409
    assert client.get(f"/api/doctor-panel/patients/{world.patient.pk}/").status_code == 200


def test_only_super_admin_manages_admins(client, world):
    client.force_authenticate(world.admin)
    assert client.get("/api/admin-panel/admin-users/").status_code == 403
    assert client.get("/api/admin-panel/settings/").status_code == 403
    assert client.get("/api/admin-panel/patients/").status_code == 200
    client.force_authenticate(world.superadmin)
    assert client.get("/api/admin-panel/admin-users/").status_code == 200
    response = client.post("/api/admin-panel/admin-users/", {"email": "newadmin@example.test", "first_name": "Admin", "password": "Secure-admin-pass1"})
    assert response.status_code == 201, response.data


def test_owner_create_doctor_cannot_verify(client, world):
    client.force_authenticate(world.owner)
    data = {"account": {"email": "owneddoctor@example.test", "first_name": "Demo", "password": "Secure-owner-pass1"}, "clinic": world.clinic.pk, "specialty": world.specialty.pk, "is_verified": True}
    response = client.post("/api/clinic-owner/doctors/", data, format="json")
    assert response.status_code == 201, response.data
    assert not response.json()["data"]["is_verified"]
