from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models.functions import Lower
from django.core.validators import RegexValidator
from common.models import TimestampedModel

phone_validator = RegexValidator(r"^\+[1-9]\d{7,14}$", "Use an international phone number, e.g. +998901234567.")


class UserManager(BaseUserManager):
    def create_user(self, phone_number=None, email=None, password=None, **extra):
        if not phone_number and not email:
            raise ValueError("A phone number or email is required.")
        user = self.model(phone_number=phone_number or None, email=email.lower() if email else None, **extra)
        user.set_password(password)
        user.full_clean(exclude=["password"])
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number=None, email=None, password=None, **extra):
        extra.update(role="super_admin", is_staff=True, is_superuser=True, is_verified=True)
        return self.create_user(phone_number, email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin, TimestampedModel):
    class Role(models.TextChoices):
        PATIENT = "patient", "Patient"
        DOCTOR = "doctor", "Doctor"
        OWNER = "clinic_owner", "Clinic Owner"
        ADMIN = "admin", "Admin"
        SUPER_ADMIN = "super_admin", "Super Admin"

    phone_number = models.CharField(max_length=16, unique=True, null=True, blank=True, validators=[phone_validator])
    email = models.EmailField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    profile_image = models.ImageField(upload_to="users/%Y/%m/", blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    objects = UserManager()
    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["first_name"]

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(Lower("email"), name="unique_email_case_insensitive"),
            models.CheckConstraint(condition=(models.Q(phone_number__isnull=False) & ~models.Q(phone_number="")) | (models.Q(email__isnull=False) & ~models.Q(email="")), name="user_has_identifier"),
        ]

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return self.get_full_name()


class PhoneOTP(TimestampedModel):
    class Purpose(models.TextChoices):
        REGISTER = "register", "Register"
        LOGIN = "login", "Login"
        VERIFY_PHONE = "verify_phone", "Verify phone"
        RESET = "reset", "Reset"

    class Channel(models.TextChoices):
        SMS = "sms", "SMS"
        TELEGRAM = "telegram", "Telegram"

    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name="phone_otps")
    phone_number = models.CharField(max_length=16, db_index=True, validators=[phone_validator])
    code_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    channel = models.CharField(max_length=20, choices=Channel.choices)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    request_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["phone_number", "purpose", "created_at"], name="accounts_ot_phone_purpose_idx")]


class TelegramAuthHandoff(models.Model):
    token_hash = models.CharField(max_length=64, unique=True)
    phone_number = models.CharField(max_length=16)
    purpose = models.CharField(max_length=10, choices=[(value, value) for value in ("login", "register")])
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    expires_at = models.DateTimeField(db_index=True)
    used_at = models.DateTimeField(null=True, blank=True)
    telegram_user_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    telegram_chat_id = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
