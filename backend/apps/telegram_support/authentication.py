import secrets
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import TelegramLink


def verify_bot(request):
    secret = request.headers.get("X-Telegram-Bot-Secret", "")
    if not settings.TELEGRAM_BOT_SECRET or not secrets.compare_digest(secret, settings.TELEGRAM_BOT_SECRET):
        raise AuthenticationFailed("Invalid bot credentials.")


class TelegramAuthentication(BaseAuthentication):
    def authenticate(self, request):
        verify_bot(request)
        try:
            telegram_id = int(request.headers.get("X-Telegram-User-Id", ""))
            link = TelegramLink.objects.select_related("user").get(telegram_user_id=telegram_id, user__is_active=True, user__role="patient")
        except (ValueError, TelegramLink.DoesNotExist):
            raise AuthenticationFailed("Link your Telegram account to DocNear first.")
        return link.user, None

    def authenticate_header(self, request):
        return "Telegram"
