from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.telegram_support.bot import BackendClient, DocNearTelegramBot, TelegramApi


class Command(BaseCommand):
    help = "Run the DocNear Telegram phone-link and OTP bot using long polling."

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true", help="Poll Telegram once and exit.")
        parser.add_argument("--poll-timeout", type=int, default=30)

    def handle(self, *args, **options):
        if not settings.TELEGRAM_OTP_ENABLED:
            raise CommandError("TELEGRAM_OTP_ENABLED=true is required to run the bot.")
        if not settings.TELEGRAM_BOT_TOKEN:
            raise CommandError("TELEGRAM_BOT_TOKEN is not configured.")
        if not settings.TELEGRAM_BOT_SECRET:
            raise CommandError("TELEGRAM_BOT_WEBHOOK_SECRET is not configured.")
        api_base_url = getattr(settings, "DOCNEAR_API_BASE_URL", "http://127.0.0.1:8001/api/v1")
        bot = DocNearTelegramBot(
            TelegramApi(settings.TELEGRAM_BOT_TOKEN),
            BackendClient(api_base_url, settings.TELEGRAM_BOT_SECRET),
        )
        self.stdout.write("DocNear Telegram boti ishga tushdi.")
        try:
            bot.poll(timeout=max(1, options["poll_timeout"]), once=options["once"])
        except KeyboardInterrupt:
            self.stdout.write("DocNear Telegram boti to‘xtatildi.")
