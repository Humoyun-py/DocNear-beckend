from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, viewsets, mixins, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from common.permissions import IsDoctor
from apps.accounts.models import User
from apps.doctors.models import DoctorProfile
from apps.doctors.serializers import DoctorProfileEditSerializer, DoctorSerializer
from apps.clinics.serializers import ClinicSerializer
from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer, CancelSerializer
from apps.appointments.views import AppointmentActionsMixin
from apps.appointments.filters import AppointmentFilter
from apps.appointments.services import transition, start_appointment
from apps.schedules.models import DoctorBreak, BlockedTime
from apps.schedules.serializers import ScheduleSerializer, BreakSerializer, BlockedTimeSerializer, BookingPolicySerializer, WeeklyScheduleSerializer, AvailabilityToggleSerializer
from apps.schedules.services import update_weekly_schedule, save_schedule_item
from apps.analytics.services import appointment_analytics


def doctor_for(request):
    return get_object_or_404(DoctorProfile.objects.select_related("user"), user=request.user)


class DoctorAppointmentViewSet(AppointmentActionsMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsDoctor]
    serializer_class = AppointmentSerializer
    filterset_class = AppointmentFilter
    search_fields = ["booking_id", "patient__first_name", "patient__last_name"]
    ordering_fields = ["appointment_date", "start_time", "created_at"]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Appointment.objects.none()
        return Appointment.objects.filter(doctor__user=self.request.user).select_related("patient", "doctor__user", "clinic", "specialty")

    def change(self, request, pk, target):
        self.get_object()
        serializer = CancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = transition(request.user, pk, target, **serializer.validated_data)
        return Response(AppointmentSerializer(result).data)

    @action(detail=True, methods=["post"], serializer_class=CancelSerializer)
    def accept(self, request, pk=None):
        return self.change(request, pk, "confirmed")

    @action(detail=True, methods=["post"], serializer_class=CancelSerializer)
    def reject(self, request, pk=None):
        return self.change(request, pk, "rejected")

    @action(detail=True, methods=["post"], serializer_class=CancelSerializer)
    def waiting(self, request, pk=None):
        return self.change(request, pk, "waiting")

    @action(detail=True, methods=["post"], serializer_class=CancelSerializer)
    def start(self, request, pk=None):
        self.get_object()
        result = start_appointment(request.user, pk)
        return Response(AppointmentSerializer(result).data)

    @action(detail=True, methods=["post"], serializer_class=CancelSerializer)
    def complete(self, request, pk=None):
        return self.change(request, pk, "completed")

    @action(detail=True, methods=["post"], serializer_class=CancelSerializer, url_path="no-show")
    def no_show(self, request, pk=None):
        return self.change(request, pk, "no_show")


class DoctorDashboard(generics.GenericAPIView):
    permission_classes = [IsDoctor]
    serializer_class = AppointmentSerializer

    def get(self, request):
        doctor = doctor_for(request)
        appointments = Appointment.objects.filter(doctor=doctor)
        stats = appointment_analytics(appointments)
        next_appointment = appointments.filter(starts_at__gte=timezone.now(), status__in=["pending", "confirmed", "waiting"]).order_by("starts_at").first()
        stats.update({"next_appointment": AppointmentSerializer(next_appointment).data if next_appointment else None,
                      "today_schedule": ScheduleSerializer(doctor.schedules.filter(day_of_week=timezone.localdate().weekday()), many=True).data,
                      "accepts_bookings": doctor.accepts_bookings, "is_verified": doctor.is_verified,
                      "notifications_count": request.user.notifications.filter(is_read=False).count()})
        return Response(stats)


class DoctorAnalytics(DoctorDashboard):
    def get(self, request):
        return Response(appointment_analytics(Appointment.objects.filter(doctor__user=request.user)))


class DoctorScheduleView(generics.GenericAPIView):
    permission_classes = [IsDoctor]
    serializer_class = WeeklyScheduleSerializer

    def get(self, request):
        doctor = doctor_for(request)
        return Response({"schedules": ScheduleSerializer(doctor.schedules.all(), many=True).data,
                         "policies": BookingPolicySerializer(doctor.affiliations.all(), many=True).data,
                         "breaks": BreakSerializer(doctor.breaks.all(), many=True).data,
                         "blocked_times": BlockedTimeSerializer(doctor.blocked_times.filter(end_datetime__gte=timezone.now()), many=True).data})

    def patch(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        update_weekly_schedule(doctor_for(request), request.data)
        return self.get(request)


class DoctorBreakViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsDoctor]
    serializer_class = BreakSerializer
    model = DoctorBreak

    def get_queryset(self):
        return self.model.objects.filter(doctor__user=self.request.user) if self.request.user.is_authenticated else self.model.objects.none()

    def perform_create(self, serializer):
        save_schedule_item(serializer, doctor_for(self.request))

    @transaction.atomic
    def perform_destroy(self, instance):
        DoctorProfile.objects.select_for_update().get(pk=instance.doctor_id)
        instance.delete()


class DoctorBlockedTimeViewSet(DoctorBreakViewSet):
    serializer_class = BlockedTimeSerializer
    model = BlockedTime


class DoctorAvailabilityToggle(generics.GenericAPIView):
    permission_classes = [IsDoctor]
    serializer_class = AvailabilityToggleSerializer

    @transaction.atomic
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doctor = get_object_or_404(DoctorProfile.objects.select_for_update(), user=request.user)
        doctor.accepts_bookings = serializer.validated_data["available"]
        doctor.save(update_fields=["accepts_bookings", "updated_at"])
        return Response({"available": doctor.accepts_bookings})


class DoctorPatientSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "first_name", "last_name"]


class DoctorPatientViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsDoctor]
    serializer_class = DoctorPatientSerializer
    search_fields = ["first_name", "last_name"]

    def get_queryset(self):
        return User.objects.filter(appointments__doctor__user=self.request.user).distinct() if self.request.user.is_authenticated else User.objects.none()

    def retrieve(self, request, *args, **kwargs):
        patient = self.get_object()
        history = Appointment.objects.filter(patient=patient, doctor__user=request.user)
        data = self.get_serializer(patient).data
        data["total_visits"] = history.filter(status="completed").count()
        data["appointment_history"] = AppointmentSerializer(history[:50], many=True).data
        last = history.filter(starts_at__lt=timezone.now()).order_by("-starts_at").first()
        upcoming = history.filter(starts_at__gte=timezone.now(), status__in=["pending", "confirmed"]).order_by("starts_at").first()
        data["last_appointment"] = AppointmentSerializer(last).data if last else None
        data["upcoming_appointment"] = AppointmentSerializer(upcoming).data if upcoming else None
        return Response(data)


class DoctorProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsDoctor]
    serializer_class = DoctorProfileEditSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return doctor_for(self.request)


class DoctorPreviewView(DoctorProfileView):
    serializer_class = DoctorSerializer
    http_method_names = ["get", "head", "options"]


class DoctorClinicsView(generics.ListAPIView):
    permission_classes = [IsDoctor]
    serializer_class = ClinicSerializer

    def get_queryset(self):
        from apps.clinics.models import Clinic
        return Clinic.objects.filter(doctor_affiliations__doctor__user=self.request.user).distinct() if self.request.user.is_authenticated else Clinic.objects.none()
