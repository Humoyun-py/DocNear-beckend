from django.db.models import Count
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from common.permissions import IsAdmin, IsSuperAdmin
from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer
from apps.appointments.serializers import AppointmentSerializer
from .serializers import AdminPatientSerializer, AdminUserCreateSerializer, StaffAccountSerializer
from .base import audit


class PatientAdminViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AdminPatientSerializer
    queryset = User.objects.filter(role="patient").annotate(booking_count=Count("appointments")).order_by("id")
    search_fields = ["first_name", "last_name", "phone_number", "email"]
    filterset_fields = ["is_active"]
    http_method_names = ["get", "patch", "post", "head", "options"]

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        data = self.get_serializer(user).data
        data["appointments"] = AppointmentSerializer(user.appointments.all()[:50], many=True).data
        return Response(data)

    def perform_update(self, serializer):
        audit(self.request, "updated", serializer.save())

    def set_active(self, request, value):
        user = self.get_object()
        if user.pk == request.user.pk:
            raise ValidationError("You cannot disable your own account.")
        user.is_active = value
        user.save(update_fields=["is_active", "updated_at"])
        audit(request, "enabled" if value else "disabled", user)
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["post"])
    def disable(self, request, pk=None):
        return self.set_active(request, False)

    @action(detail=True, methods=["post"])
    def enable(self, request, pk=None):
        return self.set_active(request, True)


class AdminUserViewSet(mixins.CreateModelMixin, PatientAdminViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = User.objects.filter(role="admin")
    serializer_class = UserSerializer

    def get_serializer_class(self):
        return AdminUserCreateSerializer if self.action == "create" else self.serializer_class

    def perform_create(self, serializer):
        audit(self.request, "admin_created", serializer.save())


class OwnerAccountViewSet(AdminUserViewSet):
    permission_classes = [IsAdmin]
    queryset = User.objects.filter(role="clinic_owner")

    def get_serializer_class(self):
        return StaffAccountSerializer if self.action == "create" else UserSerializer

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "account_role": "clinic_owner"}
