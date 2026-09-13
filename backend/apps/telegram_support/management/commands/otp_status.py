from django.core.management.base import BaseCommand
from django.db.models import F
from django.utils import timezone

from apps.accounts.models import PhoneOTP


class Command(BaseCommand):
    help = "Show aggregate OTP health without exposing phones, hashes, or codes."

    def handle(self, *args, **options):
        now = timezone.now()
        pending = PhoneOTP.objects.filter(verified_at__isnull=True)
        active = pending.filter(expires_at__gt=now, attempts__lt=F("max_attempts")).count()
        expired = pending.filter(expires_at__lte=now).count()
        exhausted = pending.filter(expires_at__gt=now, attempts__gte=F("max_attempts")).count()
        self.stdout.write(f"Active OTP count: {active}")
        self.stdout.write(f"Expired OTP count: {expired}")
        self.stdout.write(f"Exhausted OTP count: {exhausted}")
        self.stdout.write("OTP details: hidden")
