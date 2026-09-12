from django.core.management.base import BaseCommand

from apps.accounts.phone import mask_phone_number
from apps.telegram_support.models import TelegramPhoneLink


class Command(BaseCommand):
    help = "List Telegram phone links without exposing phone numbers or chat IDs."

    def handle(self, *args, **options):
        links = TelegramPhoneLink.objects.select_related("user").order_by("id")
        self.stdout.write(f"Telegram links count: {links.count()}")
        for link in links:
            account_ready = bool(link.user and link.user.is_active and link.user.is_verified)
            role = link.user.role if link.user else "none"
            self.stdout.write(
                f"{mask_phone_number(link.phone_number)} -> "
                f"chat_id {'exists' if link.telegram_chat_id else 'missing'}, "
                f"active={str(link.is_active).lower()}, "
                f"account_ready={str(account_ready).lower()}, role={role}"
            )
