from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from common.models import TimestampedModel
from common.validators import icon_name, working_hours


class ClinicService(TimestampedModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=50, default="stethoscope", validators=[icon_name])
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ClinicQuerySet(models.QuerySet):
    def public(self):
        return self.filter(is_active=True, is_verified=True, is_partner=True)


class Clinic(TimestampedModel):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="owned_clinics", limit_choices_to={"role": "clinic_owner"})
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="clinics/logos/", blank=True)
    cover_image = models.ImageField(upload_to="clinics/covers/", blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=500)
    latitude = models.FloatField(db_index=True, validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.FloatField(db_index=True, validators=[MinValueValidator(-180), MaxValueValidator(180)])
    working_hours = models.JSONField(default=dict, validators=[working_hours])
    services = models.ManyToManyField(ClinicService, blank=True, related_name="clinics")
    facilities = models.JSONField(default=list, blank=True)
    is_24_7 = models.BooleanField(default=False)
    has_emergency_service = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_partner = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, editable=False)
    objects = ClinicQuerySet.as_manager()

    class Meta:
        ordering = ["name", "id"]
        indexes = [models.Index(fields=["is_partner", "is_active", "is_verified"])]
        constraints = [
            models.CheckConstraint(condition=models.Q(latitude__gte=-90, latitude__lte=90), name="clinic_valid_latitude"),
            models.CheckConstraint(condition=models.Q(longitude__gte=-180, longitude__lte=180), name="clinic_valid_longitude"),
        ]

    def __str__(self):
        return self.name


class ClinicImage(models.Model):
    clinic = models.ForeignKey(Clinic, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="clinics/gallery/%Y/%m/")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]
