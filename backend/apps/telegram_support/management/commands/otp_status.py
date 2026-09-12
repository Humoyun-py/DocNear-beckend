from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import PhoneOTP


class Command(BaseCommand):
    help = "Show aggregate OTP health without exposing phones, hashes, or codes."

    def handle(self, *args, **options):
        now = timezone.now()
        active = PhoneOTP.objects.filter(verified_at__isnull=True, expires_at__gt=now).count()
        expired = PhoneOTP.objects.filter(verified_at__isnull=True, expires_at__lte=now).count()
        self.stdout.write(f"Active OTP count: {active}")
        self.stdout.write(f"Expired OTP count: {expired}")
        self.stdout.write("OTP details: hidden")
