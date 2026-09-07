import secrets
from django.db import models
from django.conf import settings
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import DateTimeRangeField, RangeOperators
from django.utils import timezone
from common.models import TimestampedModel

OCCUPYING_STATUSES = ("pending", "confirmed", "waiting", "in_progress", "completed", "no_show")
ACTIVE_STATUSES = ("pending", "confirmed", "waiting", "in_progress")


def booking_id():
    return f"DN-{timezone.localdate():%Y%m%d}-{secrets.token_hex(5).upper()}"


class Appointment(TimestampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        WAITING = "waiting", "Waiting"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        REJECTED = "rejected", "Rejected"
        NO_SHOW = "no_show", "No show"

    booking_id = models.CharField(max_length=32, unique=True, default=booking_id, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="appointments", on_delete=models.PROTECT)
    doctor = models.ForeignKey("doctors.DoctorProfile", related_name="appointments", on_delete=models.PROTECT)
    clinic = models.ForeignKey("clinics.Clinic", related_name="appointments", on_delete=models.PROTECT)
    specialty = models.ForeignKey("specialties.Specialty", on_delete=models.PROTECT)
    appointment_date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    reserved_until = models.DateTimeField()
    patient_note = models.TextField(blank=True, max_length=2000)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    cancel_reason = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["-appointment_date", "-start_time", "-id"]
        indexes = [models.Index(fields=["doctor", "appointment_date"]), models.Index(fields=["clinic", "appointment_date"]), models.Index(fields=["patient", "status"])]
        constraints = [
            models.CheckConstraint(condition=models.Q(starts_at__lt=models.F("ends_at"), ends_at__lte=models.F("reserved_until")), name="valid_appointment_interval"),
            ExclusionConstraint(name="exclude_doctor_overlapping_reservations", expressions=[
                ("doctor", RangeOperators.EQUAL),
                (models.Func("starts_at", "reserved_until", models.Value("[)"), function="TSTZRANGE", output_field=DateTimeRangeField()), RangeOperators.OVERLAPS),
            ], condition=models.Q(status__in=OCCUPYING_STATUSES)),
        ]


class AppointmentEvent(models.Model):
    appointment = models.ForeignKey(Appointment, related_name="events", on_delete=models.CASCADE)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=40)
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
