import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import APIException, Throttled, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.telegram_support.models import TelegramPhoneLink

from .models import PhoneOTP, User
from .sms import SmsDeliveryError, get_sms_provider
from .telegram_otp import send_telegram_code


class TelegramNotLinked(APIException):
    status_code = 400
    default_code = "telegram_not_linked"
    default_detail = "Bu raqam Telegram bot bilan ulanmagan. Avval botga kirib telefon raqamingizni ulashing."


class OtpDeliveryFailed(APIException):
    status_code = 503
    default_code = "otp_delivery_failed"
    default_detail = "Tasdiqlash kodini yuborib bo‘lmadi. Keyinroq qayta urinib ko‘ring."


GENERIC_REQUEST_MESSAGE = "Agar raqamdan foydalanish mumkin bo‘lsa, tasdiqlash kodi yuborildi."
GENERIC_VERIFY_ERROR = "Tasdiqlash kodi noto‘g‘ri yoki muddati tugagan."


def generate_code() -> str:
    test_code = getattr(settings, "OTP_TEST_CODE", "")
    if getattr(settings, "OTP_TEST_MODE", False) and test_code:
        return str(test_code)
    return f"{secrets.randbelow(1_000_000):06d}"


def client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return (forwarded.split(",", 1)[0].strip() if forwarded else request.META.get("REMOTE_ADDR")) or None


def _rate_limit(phone_number: str, ip: str | None) -> None:
    since = timezone.now() - timedelta(minutes=10)
    recent = PhoneOTP.objects.filter(phone_number=phone_number, created_at__gte=since).count()
    if recent >= settings.OTP_PHONE_REQUEST_LIMIT:
        raise Throttled(detail="Yangi kod so‘rashdan oldin biroz kuting.")
    if ip and PhoneOTP.objects.filter(request_ip=ip, created_at__gte=since).count() >= settings.OTP_IP_REQUEST_LIMIT:
        raise Throttled(detail="Juda ko‘p so‘rov yuborildi. Keyinroq qayta urinib ko‘ring.")


def _eligible_user(phone_number: str, purpose: str, names: dict) -> User | None:
    user = User.objects.filter(phone_number=phone_number).first()
    if purpose == PhoneOTP.Purpose.REGISTER:
        if user and user.is_verified:
            return None
        if user is None:
            user = User.objects.create_user(
                phone_number=phone_number,
                first_name=names.get("first_name") or "Foydalanuvchi",
                last_name=names.get("last_name") or "",
                role=User.Role.PATIENT,
                is_active=False,
                is_verified=False,
            )
            user.set_unusable_password()
            user.save(update_fields=["password", "updated_at"])
        return user
    if purpose == PhoneOTP.Purpose.LOGIN and user and user.is_active and user.is_verified:
        return user
    return None


def request_code(*, request, phone_number: str, purpose: str, channel: str, **names) -> str:
    ip = client_ip(request)
    with transaction.atomic():
        _rate_limit(phone_number, ip)
        user = _eligible_user(phone_number, purpose, names)
        if user:
            TelegramPhoneLink.objects.filter(phone_number=phone_number).exclude(user=user).update(
                user=user,
                updated_at=timezone.now(),
            )
        link = None
        if channel == PhoneOTP.Channel.TELEGRAM:
            link = TelegramPhoneLink.objects.filter(phone_number=phone_number, is_active=True).first()
            if not link:
                raise TelegramNotLinked()
        PhoneOTP.objects.filter(
            phone_number=phone_number,
            purpose=purpose,
            verified_at__isnull=True,
        ).update(verified_at=timezone.now())
        code = generate_code()
        otp = PhoneOTP.objects.create(
            user=user,
            phone_number=phone_number,
            code_hash=make_password(code),
            purpose=purpose,
            channel=channel,
            expires_at=timezone.now() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
            max_attempts=settings.OTP_MAX_ATTEMPTS,
            request_ip=ip,
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:1000],
        )
    if user is None:
        return GENERIC_REQUEST_MESSAGE
    try:
        if channel == PhoneOTP.Channel.SMS:
            get_sms_provider().send_code(phone_number, code)
        else:
            send_telegram_code(link.telegram_chat_id, code)
    except SmsDeliveryError as exc:
        PhoneOTP.objects.filter(pk=otp.pk).update(verified_at=timezone.now())
        raise OtpDeliveryFailed() from exc
    return GENERIC_REQUEST_MESSAGE


def verify_code(*, phone_number: str, purpose: str, code: str) -> tuple[User, str, str]:
    invalid = False
    with transaction.atomic():
        otp = PhoneOTP.objects.select_for_update().filter(
            phone_number=phone_number,
            purpose=purpose,
            verified_at__isnull=True,
        ).order_by("-created_at").first()
        now = timezone.now()
        if not otp or otp.expires_at <= now or otp.attempts >= otp.max_attempts:
            invalid = True
        else:
            otp.attempts += 1
            if not check_password(code, otp.code_hash):
                otp.save(update_fields=["attempts", "updated_at"])
                invalid = True
            else:
                user = otp.user
                if not user:
                    invalid = True
                elif purpose == PhoneOTP.Purpose.REGISTER:
                    user.is_active = True
                    user.is_verified = True
                    user.save(update_fields=["is_active", "is_verified", "updated_at"])
                elif not user.is_active or not user.is_verified:
                    invalid = True
                if not invalid:
                    otp.verified_at = now
                    otp.save(update_fields=["attempts", "verified_at", "updated_at"])
                    PhoneOTP.objects.filter(phone_number=phone_number, verified_at__isnull=True).exclude(pk=otp.pk).update(verified_at=now)
    if invalid:
        raise ValidationError(GENERIC_VERIFY_ERROR)
    refresh = RefreshToken.for_user(user)
    return user, str(refresh.access_token), str(refresh)
