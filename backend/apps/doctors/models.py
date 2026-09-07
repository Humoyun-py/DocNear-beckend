from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from common.models import TimestampedModel


class DoctorQuerySet(models.QuerySet):
    def public(self):
        return self.filter(is_active=True, is_verified=True, user__is_active=True,
                           affiliations__is_active=True, affiliations__clinic__is_active=True,
                           affiliations__clinic__is_partner=True, affiliations__clinic__is_verified=True).distinct()


class DoctorProfile(TimestampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="doctor_profile", on_delete=models.PROTECT, limit_choices_to={"role": "doctor"})
    profile_image = models.ImageField(upload_to="doctors/%Y/%m/", blank=True)
    bio = models.TextField(blank=True)
    experience_years = models.PositiveSmallIntegerField(default=0)
    education = models.TextField(blank=True)
    certifications = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    pending_profile = models.JSONField(default=dict, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, editable=False)
    total_reviews = models.PositiveIntegerField(default=0, editable=False)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    accepts_bookings = models.BooleanField(default=True)
    objects = DoctorQuerySet.as_manager()

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.user.get_full_name()


class DoctorClinic(TimestampedModel):
    doctor = models.ForeignKey(DoctorProfile, related_name="affiliations", on_delete=models.CASCADE)
    clinic = models.ForeignKey("clinics.Clinic", related_name="doctor_affiliations", on_delete=models.PROTECT)
    specialty = models.ForeignKey("specialties.Specialty", on_delete=models.PROTECT)
    is_primary = models.BooleanField(default=False)
    consultation_duration = models.PositiveSmallIntegerField(default=30, validators=[MinValueValidator(5), MaxValueValidator(240)])
    buffer_time = models.PositiveSmallIntegerField(default=0, validators=[MaxValueValidator(120)])
    max_appointments_per_day = models.PositiveSmallIntegerField(default=20, validators=[MinValueValidator(1)])
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(fields=["doctor", "clinic"], name="unique_doctor_clinic"),
            models.UniqueConstraint(fields=["doctor"], condition=models.Q(is_primary=True), name="one_primary_clinic"),
            models.CheckConstraint(condition=models.Q(consultation_duration__gte=5, consultation_duration__lte=240, buffer_time__lte=120, max_appointments_per_day__gte=1), name="valid_booking_policy"),
        ]
