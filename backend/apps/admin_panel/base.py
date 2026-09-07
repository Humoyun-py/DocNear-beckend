from rest_framework import viewsets
from common.permissions import IsAdmin
from .models import AuditLog


def audit(request, action, instance):
    AuditLog.objects.create(actor=request.user, action=action, object_type=instance._meta.label_lower, object_id=str(instance.pk))


class AdminModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def perform_create(self, serializer):
        audit(self.request, "created", serializer.save())

    def perform_update(self, serializer):
        audit(self.request, "updated", serializer.save())

    def perform_destroy(self, instance):
        audit(self.request, "deleted", instance)
        instance.delete()
