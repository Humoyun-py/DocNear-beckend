import secrets
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import TelegramLink, TelegramPhoneLink


def verify_bot(request):
    secret = request.headers.get("X-Telegram-Bot-Secret", "")
    if not settings.TELEGRAM_BOT_SECRET or not secrets.compare_digest(secret, settings.TELEGRAM_BOT_SECRET):
        raise AuthenticationFailed("Invalid bot credentials.")


class TelegramAuthentication(BaseAuthentication):
    def authenticate(self, request):
        verify_bot(request)
        try:
            telegram_id = int(request.headers.get("X-Telegram-User-Id", ""))
        except ValueError as exc:
            raise AuthenticationFailed("Link your Telegram account to DocNear first.") from exc
        phone_link = TelegramPhoneLink.objects.select_related("user").filter(
            telegram_user_id=telegram_id,
            is_active=True,
            user__is_active=True,
            user__role="patient",
        ).first()
        if phone_link:
            return phone_link.user, None
        try:
            link = TelegramLink.objects.select_related("user").get(
                telegram_user_id=telegram_id,
                user__is_active=True,
                user__role="patient",
            )
        except TelegramLink.DoesNotExist:
            raise AuthenticationFailed("Link your Telegram account to DocNear first.")
        return link.user, None

    def authenticate_header(self, request):
        return "Telegram"
