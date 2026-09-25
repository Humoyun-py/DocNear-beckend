from datetime import timedelta
import hashlib
import re
from urllib.parse import parse_qs, urlsplit

import pytest
from django.contrib.auth.hashers import check_password
from django.utils import timezone

from apps.accounts.models import PhoneOTP, TelegramAuthHandoff, User
from apps.accounts.sms import SmsDeliveryError
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


def create_handoff(client, settings, phone, purpose="login", **names):
    settings.TELEGRAM_BOT_USERNAME = "docnear_test_bot"
    if purpose == "login" and not User.objects.filter(phone_number=phone).exists():
        otp_user(phone)
    response = client.post("/api/v1/auth/telegram-handoff/", {
        "phone_number": phone,
        "purpose": purpose,
        **names,
    })
    result = data(response)
    token = parse_qs(urlsplit(result["bot_url"]).query)["start"][0]
    return result["bot_url"], token


def bot_headers(settings):
    settings.TELEGRAM_BOT_SECRET = "test-bot-secret"
    return {"HTTP_X_TELEGRAM_BOT_SECRET": "test-bot-secret"}


def claim_handoff(client, headers, token, telegram_id=501):
    return client.post("/api/v1/telegram/handoff/claim/", {
        "token": token,
        "telegram_user_id": telegram_id,
        "telegram_chat_id": telegram_id,
    }, format="json", **headers)


def complete_handoff(client, headers, phone, telegram_id=501, contact_user_id=None):
    return client.post("/api/v1/telegram/handoff/complete/", {
        "phone_number": phone,
        "telegram_user_id": telegram_id,
        "telegram_chat_id": telegram_id,
        "contact_user_id": contact_user_id or telegram_id,
        "sender_user_id": telegram_id,
    }, format="json", **headers)


def test_telegram_handoff_login_is_opaque_and_stores_only_hash(client, settings):
    phone = "+998901234580"
    bot_url, token = create_handoff(client, settings, phone)
    handoff = TelegramAuthHandoff.objects.get()
    assert token not in handoff.token_hash
    assert handoff.token_hash == hashlib.sha256(token.encode()).hexdigest()
    assert len(handoff.token_hash) == 64
    assert 299 <= (handoff.expires_at - handoff.created_at).total_seconds() <= 301
    assert phone not in bot_url
    assert "docnear_test_bot" in bot_url


def test_telegram_handoff_requires_configured_username(client, settings):
    settings.TELEGRAM_BOT_USERNAME = ""
    otp_user("+998901234579")
    response = client.post("/api/v1/auth/telegram-handoff/", {
        "phone_number": "+998901234579",
        "purpose": "login",
    })
    assert response.status_code == 400
    assert "Telegram bot hozircha sozlanmagan." in str(response.data)


def test_telegram_handoff_url_has_safe_origin_and_no_personal_data(client, settings):
    phone = "+998901234578"
    bot_url, token = create_handoff(
        client, settings, phone, "register", first_name="Aziza", last_name="Saidova",
    )
    parsed = urlsplit(bot_url)
    assert (parsed.scheme, parsed.netloc) == ("https", "t.me")
    assert parsed.path == "/docnear_test_bot"
    assert parse_qs(parsed.query) == {"start": [token]}
    assert phone not in bot_url and "Aziza" not in bot_url and "Saidova" not in bot_url
    assert re.fullmatch(r"[A-Za-z0-9_-]{20,}", token)


def test_register_handoff_stores_names_outside_bot_url(client, settings):
    bot_url, _ = create_handoff(
        client, settings, "+998901234581", "register", first_name="Ali", last_name="Valiyev",
    )
    handoff = TelegramAuthHandoff.objects.get()
    assert (handoff.first_name, handoff.last_name) == ("Ali", "Valiyev")
    assert "Ali" not in bot_url and "Valiyev" not in bot_url and handoff.phone_number not in bot_url


@pytest.mark.parametrize("purpose", ["login", "register"])
@pytest.mark.parametrize("account_exists", [False, True])
def test_initial_handoff_does_not_enumerate_accounts(client, settings, purpose, account_exists):
    phone = f"+9989012345{int(account_exists)}{0 if purpose == 'login' else 1}"
    if account_exists:
        otp_user(phone)
    settings.TELEGRAM_BOT_USERNAME = "docnear_test_bot"
    payload = {"phone_number": phone, "purpose": purpose}
    if purpose == "register":
        payload["first_name"] = "Enumeration safe"

    response = client.post("/api/v1/auth/telegram-handoff/", payload)

    result = data(response)
    assert set(result) == {"bot_url"}
    assert TelegramAuthHandoff.objects.filter(phone_number=phone, purpose=purpose).exists()
    assert not PhoneOTP.objects.exists()


def test_disabled_handoff_is_generic_and_creates_nothing(client, settings):
    existing = "+998901234570"
    missing = "+998901234571"
    otp_user(existing)
    settings.TELEGRAM_OTP_ENABLED = False
    settings.TELEGRAM_BOT_USERNAME = "docnear_test_bot"

    responses = [
        client.post("/api/v1/auth/telegram-handoff/", {
            "phone_number": existing, "purpose": "login",
        }),
        client.post("/api/v1/auth/telegram-handoff/", {
            "phone_number": missing, "purpose": "register", "first_name": "New",
        }),
    ]

    bodies = [error(response, 503) for response in responses]
    assert bodies[0] == bodies[1]
    assert bodies[0]["code"] == "telegram_otp_disabled"
    assert not TelegramAuthHandoff.objects.exists()


def test_disabled_handoff_cannot_be_claimed(client, settings):
    _, token = create_handoff(client, settings, "+998901234572", "register", first_name="Disabled")
    headers = bot_headers(settings)
    settings.TELEGRAM_OTP_ENABLED = False

    result = error(claim_handoff(client, headers, token), 503)

    assert result["code"] == "telegram_otp_disabled"
    assert TelegramAuthHandoff.objects.get().telegram_user_id is None


def test_register_handoff_claim_returns_full_registration_context(client, settings):
    phone = "+998901234577"
    _, token = create_handoff(
        client, settings, phone, "register", first_name="Madina", last_name="Ergasheva",
    )
    claimed = data(claim_handoff(client, bot_headers(settings), token, 701))
    assert claimed == {
        "claimed": True,
        "purpose": "register",
        "phone_number": phone,
        "first_name": "Madina",
        "last_name": "Ergasheva",
    }


def test_expired_reused_and_wrong_user_handoff_tokens_are_rejected(client, settings):
    headers = bot_headers(settings)
    _, expired = create_handoff(client, settings, "+998901234582")
    TelegramAuthHandoff.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
    assert error(claim_handoff(client, headers, expired), 400)["code"] == "telegram_handoff_invalid"

    TelegramAuthHandoff.objects.all().delete()
    _, claimed = create_handoff(client, settings, "+998901234583")
    private_chat_rejected = client.post("/api/v1/telegram/handoff/claim/", {
        "token": claimed, "telegram_user_id": 501, "telegram_chat_id": -100123,
    }, format="json", **headers)
    assert private_chat_rejected.status_code == 400
    assert claim_handoff(client, headers, claimed, 501).status_code == 200
    assert error(claim_handoff(client, headers, claimed, 501), 400)["code"] == "telegram_handoff_invalid"
    assert error(claim_handoff(client, headers, claimed, 502), 400)["code"] == "telegram_handoff_invalid"
    handoff = TelegramAuthHandoff.objects.get()
    assert (handoff.telegram_user_id, handoff.telegram_chat_id) == (501, 501)


def test_handoff_contact_mismatch_and_other_contact_do_not_consume(client, settings):
    headers = bot_headers(settings)
    _, token = create_handoff(client, settings, "+998901234584")
    assert claim_handoff(client, headers, token).status_code == 200
    mismatch = complete_handoff(client, headers, "+998901234585")
    assert error(mismatch, 400)["code"] == "telegram_handoff_phone_mismatch"
    assert TelegramAuthHandoff.objects.get().used_at is None
    assert not PhoneOTP.objects.exists() and not TelegramPhoneLink.objects.exists()
    other = complete_handoff(client, headers, "+998901234584", contact_user_id=999)
    assert other.status_code == 400
    assert TelegramAuthHandoff.objects.get().used_at is None


def test_valid_login_handoff_sends_telegram_otp_and_is_single_use(client, settings):
    headers = bot_headers(settings)
    phone = "+998901234586"
    otp_user(phone)
    _, token = create_handoff(client, settings, phone)
    assert claim_handoff(client, headers, token).status_code == 200
    assert data(complete_handoff(client, headers, phone))["purpose"] == "login"
    assert PhoneOTP.objects.filter(phone_number=phone, purpose="login", channel="telegram").exists()
    assert TelegramAuthHandoff.objects.get().used_at is not None
    assert error(claim_handoff(client, headers, token), 400)["code"] == "telegram_handoff_invalid"


def test_valid_register_handoff_preserves_names_through_verification(client, settings):
    headers = bot_headers(settings)
    phone = "+998901234587"
    _, token = create_handoff(
        client, settings, phone, "register", first_name="Dilnoza", last_name="Karimova",
    )
    assert claim_handoff(client, headers, token, 601).status_code == 200
    assert data(complete_handoff(client, headers, phone, 601))["purpose"] == "register"
    user = User.objects.get(phone_number=phone)
    assert (user.first_name, user.last_name) == ("Dilnoza", "Karimova")
    assert data(verify_otp(client, phone, "register"))["user"]["first_name"] == "Dilnoza"


def test_register_handoff_completion_detects_account_creation_race(client, settings):
    headers = bot_headers(settings)
    phone = "+998901234573"
    _, token = create_handoff(client, settings, phone, "register", first_name="Race")
    otp_user(phone)
    assert claim_handoff(client, headers, token, 801).status_code == 200
    result = error(complete_handoff(client, headers, phone, 801), 400)
    assert result["code"] == "account_already_exists"
    assert User.objects.filter(phone_number=phone).count() == 1
    assert not PhoneOTP.objects.filter(phone_number=phone).exists()
    assert TelegramAuthHandoff.objects.get().used_at is None


def test_handoff_raw_token_is_not_logged(client, settings, caplog):
    headers = bot_headers(settings)
    _, token = create_handoff(client, settings, "+998901234588")
    assert claim_handoff(client, headers, token).status_code == 200
    assert token not in caplog.text


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
    assert request_otp(client, "123").status_code == 400
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


@pytest.mark.parametrize("raw", ["998901234567", "+998901234567", "90 123 45 67", "(90) 123-45-67"])
def test_uzbek_phone_inputs_are_normalized_consistently(client, raw):
    user = otp_user()
    assert request_otp(client, raw).status_code == 200
    assert PhoneOTP.objects.filter(phone_number=user.phone_number).exists()


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
        "telegram_chat_id": 101,
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


def test_phone_cannot_be_relinked_to_another_telegram_user(client, settings):
    settings.TELEGRAM_BOT_SECRET = "test-bot-secret"
    headers = {"HTTP_X_TELEGRAM_BOT_SECRET": "test-bot-secret"}
    phone = "+998901234579"
    first = {
        "phone_number": phone,
        "telegram_user_id": 101,
        "telegram_chat_id": 101,
        "contact_user_id": 101,
        "sender_user_id": 101,
    }
    assert client.post("/api/v1/telegram/phone-link/", first, format="json", **headers).status_code == 200
    second = {
        "phone_number": phone,
        "telegram_user_id": 202,
        "telegram_chat_id": 202,
        "contact_user_id": 202,
        "sender_user_id": 202,
    }
    assert client.post("/api/v1/telegram/phone-link/", second, format="json", **headers).status_code == 400
    link = TelegramPhoneLink.objects.get(phone_number=phone)
    assert link.telegram_user_id == 101
    assert link.telegram_chat_id == 101


def test_telegram_otp_can_be_disabled_without_affecting_sms(client, settings):
    user = otp_user("+998901234573")
    settings.TELEGRAM_OTP_ENABLED = False
    response = request_otp(client, user.phone_number, channel="telegram")
    assert error(response, 503)["code"] == "telegram_otp_disabled"
    assert request_otp(client, user.phone_number, channel="sms").status_code == 200


def test_telegram_login_never_returns_false_success_for_unregistered_link(client, settings):
    settings.TELEGRAM_BOT_SECRET = "test-bot-secret"
    phone = "+998901234574"
    TelegramPhoneLink.objects.create(
        phone_number=phone,
        telegram_user_id=701,
        telegram_chat_id=701,
        is_active=True,
    )
    response = request_otp(client, phone, channel="telegram")
    assert error(response, 400)["code"] == "account_not_found"
    assert not PhoneOTP.objects.filter(phone_number=phone).exists()


def test_telegram_send_failure_returns_specific_error_and_invalidates_otp(client, settings, monkeypatch):
    settings.OTP_TEST_MODE = False
    user = otp_user("+998901234575")
    TelegramPhoneLink.objects.create(
        user=user,
        phone_number=user.phone_number,
        telegram_user_id=801,
        telegram_chat_id=801,
        is_active=True,
    )

    def fail_delivery(chat_id, code):
        raise SmsDeliveryError("unsafe provider detail")

    monkeypatch.setattr("apps.accounts.otp.send_telegram_code", fail_delivery)
    response = request_otp(client, user.phone_number, channel="telegram")
    assert error(response, 503)["code"] == "telegram_send_failed"
    otp = PhoneOTP.objects.get(phone_number=user.phone_number)
    assert otp.verified_at is not None
    assert "unsafe provider detail" not in response.content.decode()


def test_telegram_send_success_stores_only_hashed_otp(client, settings, monkeypatch, caplog):
    settings.OTP_TEST_MODE = False
    settings.TELEGRAM_BOT_TOKEN = "sensitive-test-token"
    user = otp_user("+998901234576")
    TelegramPhoneLink.objects.create(
        user=user,
        phone_number=user.phone_number,
        telegram_user_id=901,
        telegram_chat_id=901,
        is_active=True,
    )
    delivered = {}

    def deliver(chat_id, code):
        delivered["chat_id"] = chat_id
        delivered["code"] = code

    monkeypatch.setattr("apps.accounts.otp.send_telegram_code", deliver)
    assert request_otp(client, user.phone_number, channel="telegram").status_code == 200
    otp = PhoneOTP.objects.get(phone_number=user.phone_number)
    assert otp.code_hash != delivered["code"]
    assert check_password(delivered["code"], otp.code_hash)
    assert delivered["chat_id"] == 901
    assert delivered["code"] not in caplog.text
    assert settings.TELEGRAM_BOT_TOKEN not in caplog.text


def test_phone_link_endpoint_normalizes_local_uzbek_number(client, settings):
    settings.TELEGRAM_BOT_SECRET = "test-bot-secret"
    response = client.post(
        "/api/v1/telegram/phone-link/",
        {
            "phone_number": "90 000 00 77",
            "telegram_user_id": 1001,
            "telegram_chat_id": 1001,
            "contact_user_id": 1001,
            "sender_user_id": 1001,
        },
        format="json",
        HTTP_X_TELEGRAM_BOT_SECRET="test-bot-secret",
    )
    assert response.status_code == 200
    assert TelegramPhoneLink.objects.get(telegram_user_id=1001).phone_number == "+998900000077"


def test_sms_registration_attaches_prelinked_telegram_contact(client, settings):
    settings.TELEGRAM_BOT_SECRET = "test-bot-secret"
    phone = "+998901234572"
    body = {
        "phone_number": phone,
        "telegram_user_id": 303,
        "telegram_chat_id": 303,
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
    limited = request_otp(client, phone)
    assert error(limited, 429)["code"] == "too_many_requests"
