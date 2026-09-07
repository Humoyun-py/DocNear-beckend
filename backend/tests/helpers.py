from datetime import time
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.appointments.services import create_booking


def authenticate(client, user):
    """Use real JWT authentication; keep test credentials in memory only."""
    client.force_authenticate(None)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    return client


def booking(world, at=time(9), patient=None):
    return create_booking(patient or world.patient, doctor_id=world.doctor.pk,
                          clinic_id=world.clinic.pk, date=world.day, time=at)


def data(response, status=200):
    assert response.status_code == status, getattr(response, "data", response.content[:200])
    body = response.json()
    assert body["success"] is True and "data" in body
    return body["data"]


def error(response, status):
    assert response.status_code == status, getattr(response, "data", response.content[:200])
    body = response.json()
    assert body["success"] is False
    assert {"code", "message", "errors"} <= body.keys()
    assert "Traceback" not in response.content.decode()
    return body


def jwt_client(user):
    return authenticate(APIClient(), user)
