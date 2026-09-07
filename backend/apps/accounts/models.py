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
