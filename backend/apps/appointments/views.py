from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from common.permissions import IsPatient
from .models import Appointment
from .serializers import AppointmentSerializer, BookingSerializer, CancelSerializer, RescheduleSerializer
from .filters import AppointmentFilter
from . import services


class AppointmentActionsMixin:
    @action(detail=True, methods=["post"], serializer_class=CancelSerializer)
    def cancel(self, request, pk=None):
        self.get_object()
        serializer = CancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = services.transition(request.user, pk, "cancelled", **serializer.validated_data)
        return Response(AppointmentSerializer(appointment, context={"request": request}).data)

    @action(detail=True, methods=["post"], serializer_class=RescheduleSerializer)
    def reschedule(self, request, pk=None):
        self.get_object()
        serializer = RescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = services.reschedule(request.user, pk, **serializer.validated_data)
        return Response(AppointmentSerializer(appointment, context={"request": request}).data)


class PatientAppointmentViewSet(AppointmentActionsMixin, mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsPatient]
    serializer_class = AppointmentSerializer
    filterset_class = AppointmentFilter
    search_fields = ["booking_id", "doctor__user__first_name", "clinic__name"]
    ordering_fields = ["appointment_date", "start_time", "created_at"]

    def get_queryset(self):
        return Appointment.objects.filter(patient=self.request.user).select_related("patient", "doctor__user", "clinic", "specialty") if self.request.user.is_authenticated else Appointment.objects.none()

    def get_serializer_class(self):
        return BookingSerializer if self.action == "create" else super().get_serializer_class()

    def create(self, request, *args, **kwargs):
        serializer = BookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = services.create_booking(request.user, **serializer.validated_data)
        return Response(AppointmentSerializer(appointment).data, status=201)

    @action(detail=False, methods=["get"], url_path="my")
    def my(self, request):
        return self.list(request)
