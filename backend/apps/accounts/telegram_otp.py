import json
from urllib import parse, request

from django.conf import settings

from .sms import SmsDeliveryError


def send_telegram_code(chat_id: int, code: str) -> None:
    if getattr(settings, "OTP_TEST_MODE", False):
        return
    if not settings.TELEGRAM_BOT_TOKEN:
        if settings.DEBUG:
            return
        raise SmsDeliveryError("Telegram bot is not configured.")
    data = parse.urlencode({
        "chat_id": str(chat_id),
        "text": f"DocNear tasdiqlash kodi: {code}\nKod {settings.OTP_EXPIRE_MINUTES} daqiqa amal qiladi.",
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
    except (OSError, ValueError) as exc:
        raise SmsDeliveryError("Telegram is unavailable.") from exc
