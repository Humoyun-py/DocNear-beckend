import json
from urllib import parse, request

from django.conf import settings

from .sms import SmsDeliveryError


def send_telegram_code(chat_id: int, code: str) -> None:
    if getattr(settings, "OTP_TEST_MODE", False):
        return
    if not settings.TELEGRAM_OTP_ENABLED:
        raise SmsDeliveryError("Telegram OTP is disabled.")
    if not settings.TELEGRAM_BOT_TOKEN:
        raise SmsDeliveryError("Telegram bot is not configured.")
    data = parse.urlencode({
        "chat_id": str(chat_id),
        "text": (
            f"DocNear tasdiqlash kodi: {code}\n\n"
            f"Kod {settings.OTP_EXPIRE_MINUTES} daqiqa amal qiladi.\n"
            "Kod hech kimga berilmasin."
        ),
    }).encode()
    req = request.Request(
        f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
        data=data,
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=10) as response:  # noqa: S310
            payload = json.loads(response.read())
            if not payload.get("ok"):
                raise SmsDeliveryError("Telegram rejected the request.")
    except (OSError, ValueError):
        # Telegram embeds the token in the request URL. Suppress the transport
        # exception so a debug traceback cannot disclose it.
        raise SmsDeliveryError("Telegram is unavailable.") from None
