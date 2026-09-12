import json
from abc import ABC, abstractmethod
from urllib import request

from django.conf import settings


class SmsDeliveryError(RuntimeError):
    pass


class SmsProvider(ABC):
    @abstractmethod
    def send_code(self, phone_number: str, code: str) -> None:
        raise NotImplementedError


class ConsoleSmsProvider(SmsProvider):
    """Development/test sink. It intentionally does not print the OTP."""

    def send_code(self, phone_number: str, code: str) -> None:
        return None


class HttpSmsProvider(SmsProvider):
    def send_code(self, phone_number: str, code: str) -> None:
        if not settings.SMS_API_URL or not settings.SMS_API_KEY:
            raise SmsDeliveryError("SMS provider is not configured.")
        payload = json.dumps({
            "phone_number": phone_number,
            "message": f"DocNear tasdiqlash kodi: {code}. Kod {settings.OTP_EXPIRE_MINUTES} daqiqa amal qiladi.",
            "sender": settings.SMS_SENDER_NAME,
        }).encode()
        req = request.Request(
            settings.SMS_API_URL,
            data=payload,
            headers={"Authorization": f"Bearer {settings.SMS_API_KEY}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=10) as response:  # noqa: S310
                if not 200 <= response.status < 300:
                    raise SmsDeliveryError("SMS provider rejected the request.")
        except OSError as exc:
            raise SmsDeliveryError("SMS provider is unavailable.") from exc


def get_sms_provider() -> SmsProvider:
    if settings.OTP_SMS_PROVIDER == "console":
        if not settings.DEBUG and not getattr(settings, "OTP_TEST_MODE", False):
            raise SmsDeliveryError("Console SMS provider is forbidden in production.")
        return ConsoleSmsProvider()
    if settings.OTP_SMS_PROVIDER == "http":
        return HttpSmsProvider()
    raise SmsDeliveryError("Unknown SMS provider.")
