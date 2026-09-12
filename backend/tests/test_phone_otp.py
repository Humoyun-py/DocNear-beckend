from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import PhoneOTP, User
from apps.telegram_support.models import TelegramPhoneLink
from .conftest import payload
from .helpers import data, error

pytestmark = pytest.mark.django_db


def request_otp(client, phone, purpose="login", channel="sms", **extra):
    return client.post("/api/v1/auth/request-otp/", {
        "phone_number": phone,
        "purpose": purpose,
        "channel": channel,
        **extra,
    })


def verify_otp(client, phone, purpose="login", code="111111"):
    return client.post("/api/v1/auth/verify-otp/", {
        "phone_number": phone,
        "purpose": purpose,
        "code": code,
    })


def otp_user(phone="+998901234567", role="patient"):
    return User.objects.create_user(
        phone_number=phone,
        first_name="OTP",
        role=role,
        is_verified=True,
    )


def test_request_and_verify_login_returns_jwt(client):
    user = otp_user()
    assert request_otp(client, user.phone_number).status_code == 200
    session = data(verify_otp(client, user.phone_number))
    assert session["access"] and session["refresh"]
    assert session["user"]["phone_number"] == user.phone_number
    client.credentials(HTTP_AUTHORIZATION="Bearer " + session["access"])
    assert data(client.get("/api/v1/auth/me/"))["id"] == user.pk


def test_register_phone_creates_verified_patient_without_password(client):
    phone = "+998901234568"
    assert request_otp(client, phone, "register", first_name="Yangi", last_name="Bemor").status_code == 200
    user = User.objects.get(phone_number=phone)
    assert not user.is_active and not user.is_verified and not user.has_usable_password()
    session = data(verify_otp(client, phone, "register"))
    user.refresh_from_db()
    assert user.is_active and user.is_verified and user.role == "patient"
    assert session["user"]["email"] is None


def test_invalid_phone_wrong_expired_and_attempt_limit(client, settings):
    assert request_otp(client, "998901234567").status_code == 400
    user = otp_user()
    request_otp(client, user.phone_number)
    error(verify_otp(client, user.phone_number, code="000000"), 400)
    otp = PhoneOTP.objects.get(phone_number=user.phone_number)
    otp.expires_at = timezone.now() - timedelta(seconds=1)
    otp.save(update_fields=["expires_at"])
    error(verify_otp(client, user.phone_number), 400)

    settings.OTP_PHONE_REQUEST_LIMIT = 10
    other = otp_user("+998901234569")
    request_otp(client, other.phone_number)
    for _ in range(5):
        error(verify_otp(client, other.phone_number, code="000000"), 400)
    error(verify_otp(client, other.phone_number), 400)


def test_resend_invalidates_previous_code(client, settings):
    settings.OTP_PHONE_REQUEST_LIMIT = 10
    user = otp_user()
    request_otp(client, user.phone_number)
    first = PhoneOTP.objects.get(phone_number=user.phone_number)
    response = client.post("/api/v1/auth/resend-otp/", {
        "phone_number": user.phone_number, "purpose": "login", "channel": "sms",
    })
    assert response.status_code == 200
    first.refresh_from_db()
    assert first.verified_at is not None
    assert PhoneOTP.objects.filter(phone_number=user.phone_number, verified_at__isnull=True).count() == 1


def test_telegram_link_requires_own_contact_and_link_for_otp(client, settings):
    settings.TELEGRAM_BOT_SECRET = "test-bot-secret"
    headers = {"HTTP_X_TELEGRAM_BOT_SECRET": "test-bot-secret"}
    phone = "+998901234570"
    user = otp_user(phone)
    body = {
        "phone_number": phone,
        "telegram_user_id": 101,
        "telegram_chat_id": 202,
        "contact_user_id": 999,
        "sender_user_id": 101,
    }
    assert client.post("/api/v1/telegram/phone-link/", body, **headers).status_code == 400
    assert error(request_otp(client, phone, channel="telegram"), 400)["code"] == "telegram_not_linked"
    body["contact_user_id"] = 101
    assert client.post("/api/v1/telegram/phone-link/", body, **headers).status_code == 200
    link = TelegramPhoneLink.objects.get(phone_number=phone)
    assert link.user == user and link.telegram_user_id == 101
    assert request_otp(client, phone, channel="telegram").status_code == 200
    assert verify_otp(client, phone).status_code == 200
    telegram_headers = {**headers, "HTTP_X_TELEGRAM_USER_ID": "101"}
    assert client.get("/api/v1/telegram/appointments/", **telegram_headers).status_code == 200
    assert client.delete("/api/v1/telegram/phone-link/", {"telegram_user_id": 101}, format="json", **headers).status_code == 200
    link.refresh_from_db()
    assert not link.is_active


def test_telegram_otp_can_be_disabled_without_affecting_sms(client, settings):
    user = otp_user("+998901234573")
    settings.TELEGRAM_OTP_ENABLED = False
    response = request_otp(client, user.phone_number, channel="telegram")
    assert error(response, 503)["code"] == "telegram_otp_disabled"
    assert request_otp(client, user.phone_number, channel="sms").status_code == 200


def test_sms_registration_attaches_prelinked_telegram_contact(client, settings):
    settings.TELEGRAM_BOT_SECRET = "test-bot-secret"
    phone = "+998901234572"
    body = {
        "phone_number": phone,
        "telegram_user_id": 303,
        "telegram_chat_id": 404,
        "contact_user_id": 303,
        "sender_user_id": 303,
    }
    assert client.post(
        "/api/v1/telegram/phone-link/",
        body,
        format="json",
        HTTP_X_TELEGRAM_BOT_SECRET="test-bot-secret",
    ).status_code == 200
    assert request_otp(client, phone, "register", first_name="Yangi").status_code == 200
    assert data(verify_otp(client, phone, "register"))["user"]["phone_number"] == phone
    assert TelegramPhoneLink.objects.get(phone_number=phone).user.phone_number == phone


def test_password_auth_disabled_and_booking_survives_phone_login(client, world, settings):
    settings.LEGACY_PASSWORD_AUTH_ENABLED = False
    world.patient.phone_number = "+998901234571"
    world.patient.is_verified = True
    world.patient.save(update_fields=["phone_number", "is_verified", "updated_at"])
    error(client.post("/api/v1/auth/login/", {"email": world.patient.email, "password": "Secure-test-pass42"}), 400)
    request_otp(client, world.patient.phone_number)
    session = data(verify_otp(client, world.patient.phone_number))
    client.credentials(HTTP_AUTHORIZATION="Bearer " + session["access"])
    assert data(client.post("/api/v1/appointments/", payload(world)), 201)["booking_id"].startswith("DN-")


@pytest.mark.parametrize(
    ("account_name", "phone", "url"),
    [
        ("doctor_user", "+998901234580", "/api/v1/doctor-panel/dashboard/"),
        ("owner", "+998901234581", "/api/v1/clinic-owner/dashboard/"),
        ("admin", "+998901234582", "/api/v1/admin-panel/dashboard/"),
        ("superadmin", "+998901234583", "/api/v1/admin-panel/dashboard/"),
    ],
)
def test_staff_roles_keep_panel_access_after_phone_otp(client, world, account_name, phone, url):
    account = getattr(world, account_name)
    account.phone_number = phone
    account.is_verified = True
    account.save(update_fields=["phone_number", "is_verified", "updated_at"])
    assert request_otp(client, phone).status_code == 200
    session = data(verify_otp(client, phone))
    assert session["user"]["role"] == account.role
    client.credentials(HTTP_AUTHORIZATION="Bearer " + session["access"])
    assert client.get(url).status_code == 200


def test_unknown_login_requests_are_generic_and_rate_limited_by_phone(client, settings):
    settings.OTP_PHONE_REQUEST_LIMIT = 2
    phone = "+998901234590"
    first = data(request_otp(client, phone))
    second = data(request_otp(client, phone))
    assert first["message"] == second["message"]
    assert PhoneOTP.objects.filter(phone_number=phone, user__isnull=True).count() == 2
    assert request_otp(client, phone).status_code == 429
