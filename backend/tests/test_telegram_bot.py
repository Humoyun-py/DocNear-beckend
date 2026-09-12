from urllib.parse import parse_qs
from urllib.error import HTTPError

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from apps.accounts.telegram_otp import send_telegram_code
from apps.accounts.sms import SmsDeliveryError
from apps.telegram_support.bot import BotServiceError, DocNearTelegramBot, NOT_LINKED_MESSAGE, TelegramApi


class FakeTelegram:
    def __init__(self):
        self.sent = []

    def send_text(self, chat_id, text, reply_markup=None):
        self.sent.append((chat_id, text, reply_markup))


class FakeBackend:
    def __init__(self):
        self.linked = []
        self.codes = []
        self.unlinked = []
        self.code_error = None

    def link_phone(self, payload):
        self.linked.append(payload)

    def request_code(self, telegram_user_id, purpose):
        if self.code_error:
            raise self.code_error
        self.codes.append((telegram_user_id, purpose))

    def unlink(self, telegram_user_id):
        self.unlinked.append(telegram_user_id)


def update(text=None, contact=None, sender=101, chat=202):
    message = {"from": {"id": sender}, "chat": {"id": chat}}
    if text is not None:
        message["text"] = text
    if contact is not None:
        message["contact"] = contact
    return {"update_id": 1, "message": message}


def bot():
    telegram, backend = FakeTelegram(), FakeBackend()
    return DocNearTelegramBot(telegram, backend), telegram, backend


def test_start_and_link_phone_are_formal_and_request_contact():
    service, telegram, _ = bot()
    service.handle_update(update("/start"))
    assert "/link_phone" in telegram.sent[-1][1]
    service.handle_update(update("/link_phone"))
    assert telegram.sent[-1][2]["keyboard"][0][0]["request_contact"] is True


def test_own_contact_links_and_foreign_contact_is_rejected():
    service, telegram, backend = bot()
    service.handle_update(update(contact={"user_id": 101, "phone_number": "998 90 000 00 01"}))
    assert backend.linked[0] == {
        "phone_number": "+998900000001",
        "telegram_user_id": 101,
        "telegram_chat_id": 202,
        "contact_user_id": 101,
        "sender_user_id": 101,
    }
    assert "muvaffaqiyatli ulandi" in telegram.sent[-1][1]
    service.handle_update(update(contact={"user_id": 999, "phone_number": "+998900000002"}))
    assert len(backend.linked) == 1
    assert telegram.sent[-1][1] == "Faqat o‘zingizga tegishli kontaktni ulashingiz mumkin."


def test_code_and_unlink_commands_use_backend_source_of_truth():
    service, telegram, backend = bot()
    service.handle_update(update("/code"))
    assert backend.codes == [(101, "login")]
    assert "Tasdiqlash kodi yuborildi" in telegram.sent[-1][1]
    backend.code_error = BotServiceError("hidden backend detail", "telegram_not_linked")
    service.handle_update(update("/code"))
    assert telegram.sent[-1][1] == NOT_LINKED_MESSAGE
    service.handle_update(update("/unlink"))
    assert backend.unlinked == [101]


def test_missing_token_is_a_controlled_command_error(settings):
    settings.TELEGRAM_OTP_ENABLED = True
    settings.TELEGRAM_BOT_TOKEN = ""
    settings.TELEGRAM_BOT_SECRET = "configured-secret"
    with pytest.raises(CommandError, match="TELEGRAM_BOT_TOKEN is not configured"):
        call_command("run_telegram_bot", once=True)


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
