from datetime import timedelta
from urllib.parse import parse_qs
from urllib.error import HTTPError

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.utils import timezone

from apps.accounts.models import PhoneOTP
from apps.accounts.telegram_otp import send_telegram_code
from apps.accounts.sms import SmsDeliveryError
from apps.telegram_support.bot import (
    ACCOUNT_ALREADY_EXISTS_MESSAGE,
    ACCOUNT_UNAVAILABLE_MESSAGE,
    BotServiceError,
    DocNearTelegramBot,
    NOT_LINKED_MESSAGE,
    REGISTER_FROM_APP_MESSAGE,
    TelegramApi,
)


class FakeTelegram:
    def __init__(self):
        self.sent = []

    def send_text(self, chat_id, text, reply_markup=None):
        self.sent.append((chat_id, text, reply_markup))


class FakeBackend:
    def __init__(self):
        self.linked = []
        self.codes = []
        self.code_requests = []
        self.unlinked = []
        self.code_error = None
        self.code_errors = {}
        self.link_error = None
        self.claimed = []
        self.claim_result = {
            "purpose": "register",
            "phone_number": "+998900000001",
            "first_name": "Ali",
            "last_name": "Valiyev",
        }
        self.handoff_result = None

    def link_phone(self, payload):
        if self.link_error:
            raise self.link_error
        self.linked.append(payload)

    def request_code(self, telegram_user_id, purpose):
        self.code_requests.append((telegram_user_id, purpose))
        if purpose in self.code_errors:
            raise self.code_errors[purpose]
        if self.code_error:
            raise self.code_error
        self.codes.append((telegram_user_id, purpose))

    def claim_handoff(self, token, telegram_user_id, telegram_chat_id):
        self.claimed.append((token, telegram_user_id, telegram_chat_id))
        return self.claim_result

    def complete_handoff(self, payload):
        if self.handoff_result is None:
            raise BotServiceError("not found", "telegram_handoff_not_found")
        return self.handoff_result

    def unlink(self, telegram_user_id):
        self.unlinked.append(telegram_user_id)


def update(text=None, contact=None, sender=101, chat=101):
    message = {"from": {"id": sender}, "chat": {"id": chat}}
    if text is not None:
        message["text"] = text
    if contact is not None:
        message["contact"] = contact
    return {"update_id": 1, "message": message}


def bot():
    telegram, backend = FakeTelegram(), FakeBackend()
    return DocNearTelegramBot(telegram, backend), telegram, backend


def test_start_requests_contact_immediately():
    service, telegram, _ = bot()
    service.handle_update(update("/start"))
    assert telegram.sent[-1][1] == (
        "DocNear botiga xush kelibsiz.\n"
        "Davom etish uchun quyidagi tugma orqali telefon raqamingizni yuboring."
    )
    assert telegram.sent[-1][2]["keyboard"][0][0] == {
        "text": "Telefon raqamni yuborish",
        "request_contact": True,
    }


def test_start_handoff_claims_opaque_token_and_requests_contact():
    service, telegram, backend = bot()
    service.handle_update(update("/start opaque-token-value-123456789"))
    assert backend.claimed == [("opaque-token-value-123456789", 101, 101)]
    assert service.pending_handoffs[(101, 101)]["purpose"] == "register"
    assert telegram.sent[-1][1] == "DocNear'da davom etish uchun telefon raqamingizni yuboring."
    assert telegram.sent[-1][2]["keyboard"][0][0]["request_contact"] is True


def test_handoff_contact_uses_backend_completion_without_legacy_otp_calls():
    service, telegram, backend = bot()
    service.handle_update(update("/start opaque-token-value-123456789"))
    backend.handoff_result = {"purpose": "register"}
    service.handle_update(update(contact={"user_id": 101, "phone_number": "+998900000001"}))
    assert backend.linked == []
    assert backend.code_requests == []
    assert telegram.sent[-1][1] == (
        "Telefon raqamingiz tasdiqlandi.\nRo'yxatdan o'tish kodi Telegram orqali yuborildi."
    )
    assert (101, 101) not in service.pending_handoffs


def test_explicit_register_handoff_never_falls_back_to_login():
    service, telegram, backend = bot()
    service.handle_update(update("/start opaque-token-value-123456789"))
    service.handle_update(update(contact={"user_id": 101, "phone_number": "+998900000001"}))
    assert backend.linked == []
    assert backend.code_requests == []
    assert telegram.sent[-1][1] == "not found"


def test_register_handoff_existing_account_has_correct_message_and_no_fallback():
    service, telegram, backend = bot()
    service.handle_update(update("/start opaque-token-value-123456789"))
    backend.handoff_result = None
    original_complete = backend.complete_handoff

    def existing_account(payload):
        del payload
        raise BotServiceError("technical detail", "account_already_exists")

    backend.complete_handoff = existing_account
    service.handle_update(update(contact={"user_id": 101, "phone_number": "+998900000001"}))
    backend.complete_handoff = original_complete
    assert backend.linked == [] and backend.code_requests == []
    assert telegram.sent[-1][1] == ACCOUNT_ALREADY_EXISTS_MESSAGE
    assert telegram.sent[-1][2] == {"remove_keyboard": True}


def test_handoff_rejects_contact_that_does_not_match_claimed_phone():
    service, telegram, backend = bot()
    service.handle_update(update("/start opaque-token-value-123456789"))
    service.handle_update(update(contact={"user_id": 101, "phone_number": "+998900000002"}))
    assert backend.linked == []
    assert backend.code_requests == []
    assert telegram.sent[-1][1] == (
        "Sayt yoki ilovada kiritilgan telefon raqamiga tegishli kontaktni yuboring."
    )


def test_link_phone_remains_backward_compatible():
    service, telegram, _ = bot()
    service.handle_update(update("/link_phone"))
    assert telegram.sent[-1][2]["keyboard"][0][0]["request_contact"] is True


def test_valid_own_contact_links_and_requests_login_code_automatically():
    service, telegram, backend = bot()
    service.handle_update(update(contact={"user_id": 101, "phone_number": "998 90 000 00 01"}))
    assert backend.linked[0] == {
        "phone_number": "+998900000001",
        "telegram_user_id": 101,
        "telegram_chat_id": 101,
        "contact_user_id": 101,
        "sender_user_id": 101,
    }
    assert backend.codes == [(101, "login")]
    assert backend.code_requests == [(101, "login")]
    assert telegram.sent[-1][1] == "Telefon raqamingiz tasdiqlandi.\nKirish kodi Telegram orqali yuborildi."
    assert telegram.sent[-1][2] == {"remove_keyboard": True}


def test_plain_start_account_unavailable_requires_app_registration():
    service, telegram, backend = bot()
    backend.code_errors["login"] = BotServiceError("account unavailable", "telegram_account_unavailable")
    service.handle_update(update(contact={"user_id": 101, "phone_number": "+998900000001"}))
    assert backend.linked
    assert backend.codes == []
    assert backend.code_requests == [(101, "login")]
    assert telegram.sent[-1][1] == REGISTER_FROM_APP_MESSAGE
    assert telegram.sent[-1][2] == {"remove_keyboard": True}


def test_other_person_contact_is_rejected_without_otp_request():
    service, telegram, backend = bot()
    service.handle_update(update(contact={"user_id": 999, "phone_number": "+998900000002"}))
    assert backend.linked == []
    assert backend.codes == []
    assert backend.code_requests == []
    assert telegram.sent[-1][1] == "Faqat o‘zingizga tegishli kontaktni ulashingiz mumkin."


def test_phone_link_error_does_not_request_otp():
    service, telegram, backend = bot()
    backend.link_error = BotServiceError("Telefon raqamini ulab bo‘lmadi.")
    service.handle_update(update(contact={"user_id": 101, "phone_number": "+998900000001"}))
    assert backend.linked == []
    assert backend.codes == []
    assert backend.code_requests == []
    assert telegram.sent[-1][1] == "Telefon raqamini ulab bo‘lmadi."


def test_full_happy_path_does_not_require_code_command():
    service, telegram, backend = bot()
    service.handle_update(update("/start"))
    service.handle_update(update(contact={"user_id": 101, "phone_number": "+998900000001"}))
    assert backend.linked
    assert backend.codes == [(101, "login")]
    assert all("/code" not in message for _, message, _ in telegram.sent)
    assert telegram.sent[-1][2] == {"remove_keyboard": True}


def test_code_and_unlink_commands_use_backend_source_of_truth():
    service, telegram, backend = bot()
    service.handle_update(update("/code"))
    assert backend.codes == [(101, "login")]
    assert telegram.sent[-1][1] == "Tasdiqlash kodi Telegram orqali yuborildi."
    backend.code_error = BotServiceError("hidden backend detail", "telegram_not_linked")
    service.handle_update(update("/code"))
    assert telegram.sent[-1][1] == NOT_LINKED_MESSAGE
    backend.code_error = BotServiceError("hidden backend detail", "telegram_account_unavailable")
    service.handle_update(update("/code"))
    assert telegram.sent[-1][1] == ACCOUNT_UNAVAILABLE_MESSAGE
    service.handle_update(update("/unlink"))
    assert backend.unlinked == [101]


def test_missing_token_is_a_controlled_command_error(settings):
    settings.TELEGRAM_OTP_ENABLED = True
    settings.TELEGRAM_BOT_TOKEN = ""
    settings.TELEGRAM_BOT_SECRET = "configured-secret"
    with pytest.raises(CommandError, match="TELEGRAM_BOT_TOKEN is not configured"):
        call_command("run_telegram_bot", once=True)


def test_run_command_clears_webhook_without_dropping_updates(settings, monkeypatch):
    settings.TELEGRAM_OTP_ENABLED = True
    settings.TELEGRAM_BOT_TOKEN = "configured-token"
    settings.TELEGRAM_BOT_SECRET = "configured-secret"
    settings.TELEGRAM_DELETE_WEBHOOK_ON_START = True
    calls = []
    monkeypatch.setattr(
        "apps.telegram_support.management.commands.run_telegram_bot.TelegramApi.delete_webhook",
        lambda self, *, drop_pending_updates: calls.append(drop_pending_updates),
    )
    monkeypatch.setattr(
        "apps.telegram_support.management.commands.run_telegram_bot.DocNearTelegramBot.poll",
        lambda self, timeout, once: None,
    )
    call_command("run_telegram_bot", once=True)
    assert calls == [False]


def test_telegram_status_never_prints_token(settings, monkeypatch, capsys):
    token = "123456:super-sensitive-token"
    settings.TELEGRAM_BOT_TOKEN = token
    settings.TELEGRAM_BOT_USERNAME = "docnear_bot"
    settings.TELEGRAM_OTP_ENABLED = True
    settings.TELEGRAM_BOT_SECRET = "configured-secret"
    monkeypatch.setattr(
        "apps.telegram_support.management.commands.telegram_status.TelegramApi.get_me",
        lambda self: {"username": "docnear_bot"},
    )
    monkeypatch.setattr(
        "apps.telegram_support.management.commands.telegram_status.TelegramApi.get_webhook_info",
        lambda self: {"url": "", "pending_update_count": 0},
    )
    call_command("telegram_status")
    output = capsys.readouterr().out
    assert "Telegram getMe: success" in output
    assert "@docnear_bot" in output
    assert "Webhook status: clear" in output
    assert "Polling compatibility: yes" in output
    assert token not in output


@pytest.mark.parametrize("failed_method", ["get_me", "get_webhook_info"])
def test_telegram_status_distinguishes_failed_api_call_without_exposing_secrets(
    settings, monkeypatch, capsys, failed_method,
):
    settings.TELEGRAM_BOT_TOKEN = "private-diagnostic-token"
    settings.TELEGRAM_BOT_SECRET = "private-diagnostic-secret"
    calls = []

    def get_me(self):
        calls.append("get_me")
        if failed_method == "get_me":
            raise BotServiceError(settings.TELEGRAM_BOT_TOKEN)
        return {"username": "docnear_bot"}

    def get_webhook_info(self):
        calls.append("get_webhook_info")
        raise BotServiceError(settings.TELEGRAM_BOT_SECRET)

    monkeypatch.setattr(TelegramApi, "get_me", get_me)
    monkeypatch.setattr(TelegramApi, "get_webhook_info", get_webhook_info)
    expected = "Telegram getMe: failed" if failed_method == "get_me" else "Telegram getWebhookInfo: failed"
    with pytest.raises(CommandError, match=expected) as caught:
        call_command("telegram_status")
    output = capsys.readouterr()
    observable = output.out + output.err + str(caught.value)
    assert settings.TELEGRAM_BOT_TOKEN not in observable
    assert settings.TELEGRAM_BOT_SECRET not in observable
    assert caught.value.__suppress_context__
    if failed_method == "get_me":
        assert calls == ["get_me"]
        assert "Telegram getMe: success" not in observable
    else:
        assert calls == ["get_me", "get_webhook_info"]
        assert "Telegram getMe: success" in observable
        assert "Polling compatibility: unknown" in observable
        assert "Telegram getMe: failed" not in observable


def test_telegram_status_with_webhook_does_not_disclose_url(settings, monkeypatch, capsys):
    settings.TELEGRAM_BOT_TOKEN = "configured-token"
    private_url = "https://example.test/private-webhook-token"
    monkeypatch.setattr(TelegramApi, "get_me", lambda self: {"username": "docnear_bot"})
    monkeypatch.setattr(
        TelegramApi, "get_webhook_info",
        lambda self: {"url": private_url, "pending_update_count": 3},
    )
    call_command("telegram_status")
    output = capsys.readouterr().out
    assert "Webhook status: configured" in output
    assert "Polling compatibility: no" in output
    assert "Pending updates: 3" in output
    assert private_url not in output


@pytest.mark.django_db
def test_otp_status_excludes_consumed_and_exhausted_challenges_without_disclosing_details(capsys):
    now = timezone.now()
    phone = "+998901234567"
    code_hash = "private-otp-hash"
    for overrides in [
        {},
        {"max_attempts": 2, "attempts": 2},
        {"expires_at": now - timedelta(minutes=1)},
        {"verified_at": now},
    ]:
        values = {
            "phone_number": phone,
            "code_hash": code_hash,
            "purpose": PhoneOTP.Purpose.LOGIN,
            "channel": PhoneOTP.Channel.SMS,
            "expires_at": now + timedelta(minutes=5),
        }
        PhoneOTP.objects.create(**(values | overrides))
    call_command("otp_status")
    output = capsys.readouterr().out
    assert "Active OTP count: 1" in output
    assert "Expired OTP count: 1" in output
    assert "Exhausted OTP count: 1" in output
    assert phone not in output
    assert code_hash not in output


def test_missing_token_returns_delivery_error_without_crashing_django(settings):
    settings.OTP_TEST_MODE = False
    settings.TELEGRAM_OTP_ENABLED = True
    settings.TELEGRAM_BOT_TOKEN = ""
    with pytest.raises(SmsDeliveryError, match="not configured"):
        send_telegram_code(202, "654321")


def test_bot_transport_error_does_not_expose_token(monkeypatch):
    token = "sensitive-bot-token"

    def fail(req, timeout):
        raise HTTPError(req.full_url, 401, "Unauthorized", {}, None)

    monkeypatch.setattr("apps.telegram_support.bot.request.urlopen", fail)
    with pytest.raises(BotServiceError) as caught:
        TelegramApi(token).get_updates(0, 1)
    assert token not in str(caught.value)
    assert caught.value.__cause__ is None


def test_telegram_delivery_never_logs_token_or_otp(settings, monkeypatch, caplog, capsys):
    settings.OTP_TEST_MODE = False
    settings.TELEGRAM_OTP_ENABLED = True
    settings.TELEGRAM_BOT_TOKEN = "sensitive-test-token"
    captured = {}

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            return b'{"ok": true}'

    def fake_urlopen(req, timeout):
        captured.update({key: values[0] for key, values in parse_qs(req.data.decode()).items()})
        assert timeout == 10
        return Response()

    monkeypatch.setattr("apps.accounts.telegram_otp.request.urlopen", fake_urlopen)
    send_telegram_code(202, "654321")
    assert captured["chat_id"] == "202"
    assert captured["text"] == (
        "DocNear tasdiqlash kodi: 654321\n\n"
        "Kod 5 daqiqa amal qiladi.\n"
        "Kod hech kimga berilmasin."
    )
    captured_output = capsys.readouterr()
    observable_output = caplog.text + captured_output.out + captured_output.err
    assert "654321" not in observable_output
    assert "sensitive-test-token" not in observable_output
