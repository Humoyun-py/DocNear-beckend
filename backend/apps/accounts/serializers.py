from django.contrib.auth import authenticate, password_validation
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "phone_number", "email", "first_name", "last_name", "profile_image", "role", "is_active", "is_verified", "created_at", "updated_at"]
        read_only_fields = ["id", "role", "is_active", "is_verified", "created_at", "updated_at", "phone_number", "email"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ["phone_number", "email", "password", "first_name", "last_name"]

    def validate(self, attrs):
        if not attrs.get("phone_number") and not attrs.get("email"):
            raise serializers.ValidationError("A phone number or email is required.")
        if attrs.get("email"):
            attrs["email"] = attrs["email"].lower()
            if User.objects.filter(email__iexact=attrs["email"]).exists():
                raise serializers.ValidationError({"email": "An account with this email already exists."})
        password_validation.validate_password(attrs["password"], User(**{k: v for k, v in attrs.items() if k != "password"}))
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data, role=User.Role.PATIENT)


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=False)
    phone_number = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        identifier = attrs.get("identifier") or attrs.get("phone_number") or attrs.get("email")
        user = authenticate(request=self.context.get("request"), username=identifier, password=attrs["password"])
        if not user:
            raise AuthenticationFailed("Invalid login credentials.")
        token = RefreshToken.for_user(user)
        return {"access": str(token.access_token), "refresh": str(token), "user": UserSerializer(user).data}


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": "Current password is incorrect."})
        password_validation.validate_password(attrs["new_password"], user)
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(write_only=True)
