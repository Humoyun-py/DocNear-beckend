import hashlib
from datetime import timedelta
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.throttling import ScopedRateThrottle
from drf_spectacular.utils import extend_schema
from apps.appointments.models import Appointment
from apps.accounts.models import TelegramAuthHandoff, User
from apps.accounts.otp import TelegramNotLinked, TelegramOtpDisabled, request_code
from apps.accounts.serializers import PhoneNumberField
from common.permissions import IsPatient
from apps.appointments.views import PatientAppointmentViewSet
from .authentication import TelegramAuthentication, verify_bot
from .models import TelegramLink, TelegramLinkCode, TelegramPhoneLink


class LinkCodeSerializer(serializers.Serializer):
    code = serializers.CharField(read_only=True)
    expires_at = serializers.DateTimeField(read_only=True)


class CreateLinkCodeView(generics.GenericAPIView):
    permission_classes = [IsPatient]
    serializer_class = LinkCodeSerializer

    def post(self, request):
        code = TelegramLinkCode.objects.create(user=request.user, expires_at=timezone.now() + timedelta(minutes=10))
        return Response(self.get_serializer(code).data, status=201)

    def delete(self, request):
        TelegramLink.objects.filter(user=request.user).delete()
        TelegramLinkCode.objects.filter(user=request.user, used_at__isnull=True).update(used_at=timezone.now())
        return Response(status=204)


class RedeemSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=100)
    telegram_user_id = serializers.IntegerField(min_value=1)


class RedeemLinkView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = RedeemSerializer

    @extend_schema(auth=[{"TelegramBotSecret": []}])
    @transaction.atomic
    def post(self, request):
        verify_bot(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        code = get_object_or_404(TelegramLinkCode.objects.select_for_update(), code=data["code"], used_at__isnull=True, expires_at__gt=timezone.now(), user__is_active=True, user__role="patient")
        if TelegramLink.objects.filter(telegram_user_id=data["telegram_user_id"]).exclude(user=code.user).exists():
            raise ValidationError("This Telegram account is already linked.")
        TelegramLink.objects.update_or_create(user=code.user, defaults={"telegram_user_id": data["telegram_user_id"]})
        code.used_at = timezone.now()
        code.save(update_fields=["used_at"])
        return Response({"linked": True})


class PhoneContactSerializer(serializers.Serializer):
    phone_number = PhoneNumberField()
    telegram_user_id = serializers.IntegerField(min_value=1)
    telegram_chat_id = serializers.IntegerField()
    contact_user_id = serializers.IntegerField(min_value=1)
    sender_user_id = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        if attrs["telegram_chat_id"] != attrs["sender_user_id"]:
            raise serializers.ValidationError("Telefonni faqat bot bilan shaxsiy chatda ulang.")
        if attrs["contact_user_id"] != attrs["sender_user_id"] or attrs["telegram_user_id"] != attrs["sender_user_id"]:
            raise serializers.ValidationError("Faqat o‘zingizga tegishli kontaktni ulashingiz mumkin.")
        return attrs


class HandoffClaimSerializer(serializers.Serializer):
    token = serializers.CharField(min_length=20, max_length=200, trim_whitespace=False)
    telegram_user_id = serializers.IntegerField(min_value=1)
    telegram_chat_id = serializers.IntegerField()

    def validate(self, attrs):
        if attrs["telegram_chat_id"] != attrs["telegram_user_id"]:
            raise serializers.ValidationError("Handoff faqat bot bilan shaxsiy chatda ishlaydi.")
        return attrs


class TelegramHandoffInvalid(APIException):
    status_code = 400
    default_code = "telegram_handoff_invalid"
    default_detail = "Telegram havolasi yaroqsiz yoki muddati tugagan."


class TelegramHandoffNotFound(APIException):
    status_code = 404
    default_code = "telegram_handoff_not_found"
    default_detail = "Faol Telegram handoff topilmadi."


class TelegramHandoffPhoneMismatch(APIException):
    status_code = 400
    default_code = "telegram_handoff_phone_mismatch"
    default_detail = "Telegram telefon raqami DocNear'da kiritilgan raqam bilan mos kelmadi."


def link_phone_contact(data):
    conflict = TelegramPhoneLink.objects.filter(
        telegram_user_id=data["telegram_user_id"],
    ).exclude(phone_number=data["phone_number"]).exists()
    if conflict:
        raise ValidationError("Bu Telegram hisobi boshqa telefon raqamiga ulangan.")
    phone_conflict = TelegramPhoneLink.objects.filter(
        phone_number=data["phone_number"],
    ).exclude(telegram_user_id=data["telegram_user_id"]).exists()
    if phone_conflict:
        raise ValidationError("Bu telefon raqami boshqa Telegram hisobiga ulangan.")
    user = User.objects.filter(phone_number=data["phone_number"], is_active=True).first()
    link, _ = TelegramPhoneLink.objects.update_or_create(
        phone_number=data["phone_number"],
        defaults={
            "user": user,
            "telegram_user_id": data["telegram_user_id"],
            "telegram_chat_id": data["telegram_chat_id"],
            "is_active": True,
        },
    )
    return link


class TelegramPhoneLinkView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = PhoneContactSerializer

    @extend_schema(auth=[{"TelegramBotSecret": []}])
    @transaction.atomic
    def post(self, request):
        verify_bot(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        link_phone_contact(data)
        return Response({"linked": True, "phone_number": data["phone_number"]})

    @extend_schema(auth=[{"TelegramBotSecret": []}])
    def delete(self, request):
        verify_bot(request)
        try:
            telegram_user_id = int(request.data.get("telegram_user_id", ""))
        except (TypeError, ValueError) as exc:
            raise ValidationError("Telegram foydalanuvchi identifikatori kerak.") from exc
        TelegramPhoneLink.objects.filter(telegram_user_id=telegram_user_id).update(is_active=False)
        return Response({"unlinked": True})


class TelegramHandoffClaimView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = HandoffClaimSerializer

    @extend_schema(auth=[{"TelegramBotSecret": []}])
    @transaction.atomic
    def post(self, request):
        verify_bot(request)
        if not settings.TELEGRAM_OTP_ENABLED:
            raise TelegramOtpDisabled()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        token_hash = hashlib.sha256(data["token"].encode()).hexdigest()
        handoff = TelegramAuthHandoff.objects.select_for_update().filter(token_hash=token_hash).first()
        if not handoff or handoff.used_at or handoff.expires_at <= timezone.now():
            raise TelegramHandoffInvalid()
        if handoff.telegram_user_id is not None:
            raise TelegramHandoffInvalid()
        handoff.telegram_user_id = data["telegram_user_id"]
        handoff.telegram_chat_id = data["telegram_chat_id"]
        handoff.save(update_fields=["telegram_user_id", "telegram_chat_id"])
        return Response({
            "claimed": True,
            "purpose": handoff.purpose,
            "phone_number": handoff.phone_number,
            "first_name": handoff.first_name,
            "last_name": handoff.last_name,
        })


class TelegramHandoffCompleteView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = PhoneContactSerializer
    @extend_schema(auth=[{"TelegramBotSecret": []}])
    @transaction.atomic
    def post(self, request):
        verify_bot(request)
        if not settings.TELEGRAM_OTP_ENABLED:
            raise TelegramOtpDisabled()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        handoff = TelegramAuthHandoff.objects.select_for_update().filter(
            telegram_user_id=data["telegram_user_id"],
            telegram_chat_id=data["telegram_chat_id"],
            used_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).order_by("-created_at").first()
        if not handoff:
            raise TelegramHandoffNotFound()
        if handoff.phone_number != data["phone_number"]:
            raise TelegramHandoffPhoneMismatch()
        link_phone_contact(data)
        message = request_code(
            request=request,
            phone_number=handoff.phone_number,
            purpose=handoff.purpose,
            channel="telegram",
            first_name=handoff.first_name,
            last_name=handoff.last_name,
        )
        handoff.used_at = timezone.now()
        handoff.save(update_fields=["used_at"])
        return Response({"message": message, "purpose": handoff.purpose})


class TelegramOTPRequestSerializer(serializers.Serializer):
    telegram_user_id = serializers.IntegerField(min_value=1)
    purpose = serializers.ChoiceField(choices=["register", "login"], default="login")


class TelegramOTPRequestView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = TelegramOTPRequestSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp_request"

    @extend_schema(auth=[{"TelegramBotSecret": []}])
    def post(self, request):
        verify_bot(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        link = TelegramPhoneLink.objects.filter(telegram_user_id=data["telegram_user_id"], is_active=True).first()
        if not link:
            raise TelegramNotLinked()
        message = request_code(
            request=request,
            phone_number=link.phone_number,
            purpose=data["purpose"],
            channel="telegram",
        )
        return Response({"message": message})


class TelegramAppointmentViewSet(PatientAppointmentViewSet):
    queryset = Appointment.objects.none()
    authentication_classes = [TelegramAuthentication]

    def by_booking_id(self, request, booking_id):
        appointment = get_object_or_404(self.get_queryset(), booking_id=booking_id)
        return Response(self.get_serializer(appointment).data)
