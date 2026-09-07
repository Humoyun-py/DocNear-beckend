from django.conf import settings
from django.db import models


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="notifications", on_delete=models.CASCADE)
    type = models.CharField(max_length=50, choices=[(v, v.replace("_", " ")) for v in (
        "booking_created", "booking_confirmed", "booking_cancelled", "booking_rescheduled", "booking_updated",
        "appointment_reminder", "doctor_schedule_changed", "doctor_verification", "clinic_verification", "system_message", "general")])
    title = models.CharField(max_length=200)
    message = models.TextField(max_length=2000)
    is_read = models.BooleanField(default=False)
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.CharField(max_length=50, blank=True)
    deduplication_key = models.CharField(max_length=120, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["user", "is_read", "-created_at"])]
