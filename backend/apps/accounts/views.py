from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.password_validation import validate_password
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.exceptions import ValidationError
from rest_framework.exceptions import APIException
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .models import User
from .serializers import (UserSerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer,
                          ForgotPasswordSerializer, ResetPasswordSerializer, LogoutSerializer,
                          RequestOTPSerializer, VerifyOTPSerializer)
from .otp import request_code, verify_code


class PasswordAuthDisabled(APIException):
    status_code = 400
    default_code = "password_auth_disabled"
    default_detail = "Telefon raqam orqali tasdiqlash kodidan foydalaning."


class AuthView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class RegisterView(AuthView):
    serializer_class = RegisterSerializer

    def post(self, request):
        if not settings.LEGACY_PASSWORD_AUTH_ENABLED:
            raise PasswordAuthDisabled()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = RefreshToken.for_user(user)
        return Response({"user": UserSerializer(user).data, "access": str(token.access_token), "refresh": str(token)}, status=status.HTTP_201_CREATED)


class LoginView(AuthView):
    serializer_class = LoginSerializer

    def post(self, request):
        if not settings.LEGACY_PASSWORD_AUTH_ENABLED:
            raise PasswordAuthDisabled()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class RequestOTPView(AuthView):
    serializer_class = RequestOTPSerializer
    throttle_scope = "otp_request"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = request_code(request=request, **serializer.validated_data)
        return Response({"message": message})


class ResendOTPView(RequestOTPView):
    pass


class VerifyOTPView(AuthView):
    serializer_class = VerifyOTPSerializer
    throttle_scope = "otp_verify"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, access, refresh = verify_code(request=request, **serializer.validated_data)
        return Response({"access": access, "refresh": refresh, "user": UserSerializer(user).data})


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user


class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            if str(token["user_id"]) != str(request.user.id):
                raise InvalidToken("Token does not belong to this account.")
            token.blacklist()
        except TokenError as exc:
            raise InvalidToken("Refresh token is invalid.") from exc
        return Response({"message": "Signed out."})


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        if not settings.LEGACY_PASSWORD_AUTH_ENABLED:
            raise PasswordAuthDisabled()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password", "updated_at"])
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
        for token in OutstandingToken.objects.filter(user=request.user):
            BlacklistedToken.objects.get_or_create(token=token)
        return Response({"message": "Password changed. Please sign in again."})


class ForgotPasswordView(AuthView):
    serializer_class = ForgotPasswordSerializer

    def post(self, request):
        if not settings.LEGACY_PASSWORD_AUTH_ENABLED:
            raise PasswordAuthDisabled()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"], is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            send_mail("Reset your DocNear password", f"Reset your password: {settings.PASSWORD_RESET_URL}?uid={uid}&token={token}", settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
        return Response({"message": "If an account matches this email, password reset instructions will be sent."})


class ResetPasswordView(AuthView):
    serializer_class = ResetPasswordSerializer

    def post(self, request):
        if not settings.LEGACY_PASSWORD_AUTH_ENABLED:
            raise PasswordAuthDisabled()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(data["uid"])), is_active=True)
        except (ValueError, TypeError, OverflowError, UnicodeDecodeError, User.DoesNotExist):
            raise ValidationError("Invalid reset link.")
        if not default_token_generator.check_token(user, data["token"]):
            raise ValidationError("Invalid or expired reset link.")
        validate_password(data["new_password"], user)
        user.set_password(data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)
        return Response({"message": "Password reset. Please sign in."})
