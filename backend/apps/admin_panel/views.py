from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from common.permissions import IsAdmin, IsSuperAdmin
from apps.accounts.models import User
from apps.clinics.models import Clinic
from apps.doctors.models import DoctorProfile
from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer, TransitionSerializer
from apps.appointments.views import AppointmentActionsMixin
from apps.appointments.filters import AppointmentFilter
from apps.appointments.services import transition
from apps.analytics.services import appointment_analytics
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer
from apps.reviews.services import moderate_review
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer, SendNotificationSerializer
from .models import PlatformSettings, AuditLog
from .serializers import PlatformSettingsSerializer, AuditLogSerializer
from .base import audit


class AdminDashboard(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AppointmentSerializer

    def get(self, request):
        result = appointment_analytics(Appointment.objects.all())
        result.update({"total_users": User.objects.count(), "total_patients": User.objects.filter(role="patient").count(),
            "total_doctors": DoctorProfile.objects.count(), "total_clinics": Clinic.objects.count(),
            "partner_clinics": Clinic.objects.filter(is_partner=True).count(),
            "pending_clinic_approvals": Clinic.objects.filter(is_verified=False, is_active=True).count(),
            "pending_doctor_verifications": DoctorProfile.objects.filter(is_verified=False, is_active=True).count(),
            "new_users_this_month": User.objects.filter(created_at__date__gte=timezone.localdate().replace(day=1)).count(),
            "revenue": None, "billing_enabled": False})
        return Response(result)


class AdminAppointmentViewSet(AppointmentActionsMixin, mixins.UpdateModelMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdmin]
    queryset = Appointment.objects.select_related("patient", "doctor__user", "clinic", "specialty")
    serializer_class = AppointmentSerializer
    filterset_class = AppointmentFilter
    search_fields = ["booking_id", "patient__first_name", "doctor__user__first_name", "clinic__name"]
    ordering_fields = ["appointment_date", "start_time", "created_at"]
    http_method_names = ["get", "patch", "post", "head", "options"]

    def get_serializer_class(self):
        return TransitionSerializer if self.action == "partial_update" else super().get_serializer_class()

    def partial_update(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = TransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = transition(request.user, obj.pk, serializer.validated_data["status"], serializer.validated_data["reason"])
        audit(request, "appointment_status_changed", result)
        return Response(AppointmentSerializer(result).data)


class AdminReviewViewSet(mixins.DestroyModelMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdmin]
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    filterset_fields = ["is_visible", "doctor", "clinic"]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        review = moderate_review(self.get_object().pk, visible=True)
        audit(request, "review_approved", review)
        return Response(self.get_serializer(review).data)

    @action(detail=True, methods=["post"])
    def hide(self, request, pk=None):
        review = moderate_review(self.get_object().pk, visible=False)
        audit(request, "review_hidden", review)
        return Response(self.get_serializer(review).data)

    def perform_destroy(self, instance):
        audit(self.request, "review_deleted", instance)
        moderate_review(instance.pk, delete=True)


class AdminNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdmin]
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    filterset_fields = ["user", "type", "is_read"]

    def deliver(self, request, broadcast):
        serializer = SendNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if not broadcast and "user_id" not in data:
            raise ValidationError({"user_id": "Select a recipient."})
        users = User.objects.filter(is_active=True)
        if "user_id" in data:
            users = users.filter(pk=data["user_id"])
        if "role" in data:
            users = users.filter(role=data["role"])
        if "clinic_id" in data:
            users = users.filter(Q(owned_clinics=data["clinic_id"]) | Q(doctor_profile__affiliations__clinic=data["clinic_id"]) | Q(appointments__clinic=data["clinic_id"])).distinct()
        count = 0
        batch = []
        for user_id in users.values_list("pk", flat=True).iterator(chunk_size=500):
            batch.append(Notification(user_id=user_id, type="system_message", title=data["title"], message=data["message"]))
            count += 1
            if len(batch) == 500:
                Notification.objects.bulk_create(batch)
                batch = []
        Notification.objects.bulk_create(batch)
        AuditLog.objects.create(actor=request.user, action="notification_broadcast" if broadcast else "notification_sent", object_type="notification", object_id=str(count))
        return Response({"sent_count": count}, status=201)

    @action(detail=False, methods=["post"], serializer_class=SendNotificationSerializer)
    def send(self, request):
        return self.deliver(request, False)

    @action(detail=False, methods=["post"], serializer_class=SendNotificationSerializer)
    def broadcast(self, request):
        return self.deliver(request, True)


class SettingsView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = PlatformSettingsSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return PlatformSettings.objects.get_or_create(name="platform")[0]

    def perform_update(self, serializer):
        audit(self.request, "settings_updated", serializer.save())


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsSuperAdmin]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related("actor")
    filterset_fields = ["actor", "action", "object_type"]
