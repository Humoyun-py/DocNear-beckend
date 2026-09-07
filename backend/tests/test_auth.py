import pytest
from apps.accounts.models import User

pytestmark = pytest.mark.django_db


def test_registration_login_rotation_logout(client):
    response = client.post("/api/auth/register/", {"email": "new@example.test", "first_name": "New", "password": "Good-password83", "role": "super_admin"})
    assert response.status_code == 201, response.data
    data = response.json()["data"]
    assert data["user"]["role"] == "patient"
    assert "password" not in data["user"]
    login = client.post("/api/auth/login/", {"email": "NEW@example.test", "password": "Good-password83"})
    assert login.status_code == 200
    tokens = login.json()["data"]
    refresh = client.post("/api/auth/token/refresh/", {"refresh": tokens["refresh"]})
    assert refresh.status_code == 200
    assert client.post("/api/auth/token/refresh/", {"refresh": tokens["refresh"]}).status_code == 401
    rotated = refresh.json()["data"]
    client.credentials(HTTP_AUTHORIZATION="Bearer " + rotated["access"])
    assert client.get("/api/auth/me/").status_code == 200
    assert client.post("/api/auth/logout/", {"refresh": rotated["refresh"]}).status_code == 200
    assert client.post("/api/auth/token/refresh/", {"refresh": rotated["refresh"]}).status_code == 401


def test_phone_login_and_duplicate_email(client):
    User.objects.create_user(phone_number="+998901234567", email="test@example.test", password="Good-password83", first_name="Test")
    assert client.post("/api/auth/login/", {"phone_number": "+998901234567", "password": "Good-password83"}).status_code == 200
    assert client.post("/api/auth/register/", {"email": "TEST@example.test", "first_name": "Test", "password": "Good-password83"}).status_code == 400


def test_profile_cannot_escalate(client, world):
    client.force_authenticate(world.patient)
    response = client.patch("/api/profile/", {"role": "admin", "is_verified": True, "first_name": "Changed"})
    assert response.status_code == 200
    world.patient.refresh_from_db()
    assert world.patient.role == "patient" and not world.patient.is_verified


def test_change_password_revokes_access(client, world):
    login = client.post("/api/auth/login/", {"email": world.patient.email, "password": "Secure-test-pass42"}).json()["data"]
    client.credentials(HTTP_AUTHORIZATION="Bearer " + login["access"])
    assert client.post("/api/auth/change-password/", {"old_password": "Secure-test-pass42", "new_password": "Another-safe-pass43"}).status_code == 200
    assert client.get("/api/auth/me/").status_code == 401
    assert client.post("/api/auth/token/refresh/", {"refresh": login["refresh"]}).status_code == 401


def test_password_reset(client, world):
    from django.core import mail
    from urllib.parse import urlparse, parse_qs
    assert client.post("/api/auth/forgot-password/", {"email": world.patient.email}).status_code == 200
    query = parse_qs(urlparse(mail.outbox[0].body.split()[-1]).query)
    body = {"uid": query["uid"][0], "token": query["token"][0], "new_password": "Reset-password43"}
    assert client.post("/api/auth/reset-password/", body).status_code == 200
    assert client.post("/api/auth/reset-password/", body).status_code == 400


@pytest.mark.parametrize("role,attribute", [("patient", "patient"), ("doctor", "doctor_user"), ("clinic_owner", "owner"), ("admin", "admin"), ("super_admin", "superadmin")])
def test_login_every_role(client, world, role, attribute):
    from .helpers import data
    user = getattr(world, attribute)
    tokens = data(client.post("/api/auth/login/", {"identifier": user.email, "password": "Secure-test-pass42"}))
    assert tokens["user"]["role"] == role
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    assert data(client.get("/api/auth/me/"))["id"] == user.pk


@pytest.mark.parametrize("token_kind", ["invalid", "expired", "wrong_signature", "refresh_as_access"])
def test_invalid_tokens(client, world, token_kind):
    from datetime import timedelta
    from rest_framework_simplejwt.tokens import RefreshToken
    from .helpers import error
    token = RefreshToken.for_user(world.patient)
    access = token.access_token
    if token_kind == "expired":
        access.set_exp(lifetime=timedelta(seconds=-10))
    value = str(token) if token_kind == "refresh_as_access" else str(access)
    if token_kind == "invalid":
        value = "invalid-jwt"
    elif token_kind == "wrong_signature":
        value = value.rsplit(".", 1)[0] + ".wrong"
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {value}")
    error(client.get("/api/auth/me/"), 401)


def test_wrong_password_weak_password_and_duplicate_phone(client, world):
    from .helpers import error
    error(client.post("/api/auth/login/", {"email": world.patient.email, "password": "wrong"}), 401)
    error(client.post("/api/auth/register/", {"first_name": "Weak", "email": "weak@example.test", "password": "123"}), 400)
    world.patient.phone_number = "+998901234567"
    world.patient.save()
    error(client.post("/api/auth/register/", {"first_name": "Duplicate", "phone_number": world.patient.phone_number, "password": "Strong-password41"}), 400)
    error(client.get("/api/auth/me/"), 401)


def test_foreign_logout_and_disabled_account_tokens(client, world):
    from .helpers import authenticate, error
    from rest_framework_simplejwt.tokens import RefreshToken
    other_token = RefreshToken.for_user(world.other)
    authenticate(client, world.patient)
    error(client.post("/api/auth/logout/", {"refresh": str(other_token)}), 401)
    # Attempted foreign logout must not invalidate the other patient's session.
    assert client.post("/api/auth/token/refresh/", {"refresh": str(other_token)}).status_code == 200
    own_token = RefreshToken.for_user(world.patient)
    world.patient.is_active = False
    world.patient.save()
    error(client.get("/api/auth/me/"), 401)
    error(client.post("/api/auth/token/refresh/", {"refresh": str(own_token)}), 401)


def test_auth_throttle_still_enabled(client, settings):
    from .helpers import error
    for _ in range(10):
        error(client.post("/api/auth/login/", {"identifier": "none@example.test", "password": "wrong"}), 401)
    error(client.post("/api/auth/login/", {"identifier": "none@example.test", "password": "wrong"}), 429)
