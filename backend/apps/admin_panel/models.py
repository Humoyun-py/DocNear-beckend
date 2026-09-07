from django.conf import settings
from django.db import models
from common.models import TimestampedModel


class PlatformSettings(TimestampedModel):
    name = models.CharField(max_length=50, unique=True, default="platform")
    support_email = models.EmailField(blank=True)
    support_phone = models.CharField(max_length=30, blank=True)
    maintenance_message = models.CharField(max_length=300, blank=True)


class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=80)
    object_type = models.CharField(max_length=80)
    object_id = models.CharField(max_length=80)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
