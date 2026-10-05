import re
from urllib.parse import urlsplit

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.telegram_support.bot import BotServiceError, TelegramApi


DEFAULT_WEBHOOK_URL = "https://docnear-api.onrender.com/api/v1/telegram/webhook/"


class Command(BaseCommand):
    help = "Register the secure DocNear Telegram webhook."

    def add_arguments(self, parser):
        parser.add_argument("--url", default=DEFAULT_WEBHOOK_URL)

    def handle(self, *args, **options):
        if not settings.TELEGRAM_OTP_ENABLED:
            raise CommandError("TELEGRAM_OTP_ENABLED=true is required to register the webhook.")
        if not settings.TELEGRAM_BOT_TOKEN:
            raise CommandError("TELEGRAM_BOT_TOKEN is not configured.")
        secret = settings.TELEGRAM_BOT_WEBHOOK_SECRET
        if not secret:
            raise CommandError("TELEGRAM_BOT_WEBHOOK_SECRET is not configured.")
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,256}", secret):
            raise CommandError("TELEGRAM_BOT_WEBHOOK_SECRET has an invalid format.")

        url = options["url"]
        parsed = urlsplit(url)
        if (parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password
                or parsed.query or parsed.fragment):
            raise CommandError("Webhook URL must be a public HTTPS URL without credentials, query, or fragment.")
        try:
            TelegramApi(settings.TELEGRAM_BOT_TOKEN).set_webhook(url, secret)
        except BotServiceError:
            raise CommandError("Telegram webhook registration failed.") from None
        self.stdout.write(self.style.SUCCESS(f"Telegram webhook registered: {url}"))
