from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.telegram_support.bot import BotServiceError, TelegramApi


class Command(BaseCommand):
    help = "Safely verify DocNear Telegram settings and the Bot API token."

    def handle(self, *args, **options):
        token_loaded = bool(settings.TELEGRAM_BOT_TOKEN)
        username_loaded = bool(settings.TELEGRAM_BOT_USERNAME)
        self.stdout.write(f"Telegram bot token: {'loaded' if token_loaded else 'missing'}")
        self.stdout.write(f"Telegram bot username: {'loaded' if username_loaded else 'missing'}")
        self.stdout.write(f"Telegram OTP enabled: {'yes' if settings.TELEGRAM_OTP_ENABLED else 'no'}")
        self.stdout.write(f"Telegram webhook secret: {'loaded' if settings.TELEGRAM_BOT_SECRET else 'missing'}")
        self.stdout.write(f"SMS provider: {settings.OTP_SMS_PROVIDER}")
        self.stdout.write(f"Database configured: {'yes' if settings.DATABASES.get('default') else 'no'}")
        if not token_loaded:
            raise CommandError("Telegram getMe: token missing")
        try:
            api = TelegramApi(settings.TELEGRAM_BOT_TOKEN)
            bot = api.get_me()
        except BotServiceError:
            raise CommandError("Telegram getMe: failed") from None
        self.stdout.write(self.style.SUCCESS("Telegram getMe: success"))
        self.stdout.write(f"Bot username: @{bot.get('username', 'unknown')}")
        try:
            webhook = api.get_webhook_info()
        except BotServiceError:
            self.stdout.write("Webhook status: unknown")
            self.stdout.write("Polling compatibility: unknown")
            raise CommandError("Telegram getWebhookInfo: failed") from None
        webhook_configured = bool(webhook.get("url"))
        self.stdout.write(f"Webhook status: {'configured' if webhook_configured else 'clear'}")
        self.stdout.write(f"Polling compatibility: {'no' if webhook_configured else 'yes'}")
        self.stdout.write(f"Pending updates: {int(webhook.get('pending_update_count', 0))}")
