from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, viewsets, mixins
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from common.permissions import IsClinicOwner
from apps.clinics.models import Clinic
from apps.clinics.serializers import ServiceSerializer
from apps.doctors.models import DoctorClinic, DoctorProfile
from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer
from apps.appointments.filters import AppointmentFilter
from apps.analytics.services import appointment_analytics
from apps.schedules.services import update_clinic, check_existing_schedule
from apps.schedules.models import DoctorSchedule
from apps.schedules.serializers import ScheduleSerializer
from .serializers import OwnerClinicSerializer, OwnerDoctorCreateSerializer, OwnerDoctorSerializer, OwnerServicesSerializer


def owned_clinic(request):
    queryset = Clinic.objects.filter(owner=request.user)
    clinic_id = request.query_params.get("clinic_id")
    if clinic_id:
        try:
            return get_object_or_404(queryset, pk=int(clinic_id))
        except ValueError:
            raise ValidationError({"clinic_id": "Use a clinic ID."})
    if queryset.count() > 1:
        raise ValidationError({"clinic_id": "Select a clinic using ?clinic_id=."})
    return get_object_or_404(queryset)


class OwnerClinicView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsClinicOwner]
    serializer_class = OwnerClinicSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return owned_clinic(self.request)

    def perform_update(self, serializer):
        update_clinic(serializer)


class OwnerClinicList(generics.ListAPIView):
    permission_classes = [IsClinicOwner]
    serializer_class = OwnerClinicSerializer

    def get_queryset(self):
        return Clinic.objects.filter(owner=self.request.user) if self.request.user.is_authenticated else Clinic.objects.none()


class OwnerDashboard(generics.GenericAPIView):
    permission_classes = [IsClinicOwner]
    serializer_class = AppointmentSerializer

    def get(self, request):
        qs = Appointment.objects.filter(clinic__owner=request.user)
        if request.query_params.get("clinic_id"):
            qs = qs.filter(clinic=owned_clinic(request))
        data = appointment_analytics(qs)
        data["clinic_count"] = Clinic.objects.filter(owner=request.user).count()
        data["doctor_count"] = DoctorClinic.objects.filter(clinic__owner=request.user, is_active=True).values("doctor").distinct().count()
        return Response(data)


class OwnerAppointmentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsClinicOwner]
    serializer_class = AppointmentSerializer
    filterset_class = AppointmentFilter
    search_fields = ["booking_id", "patient__first_name", "doctor__user__first_name"]

    def get_queryset(self):
        return Appointment.objects.filter(clinic__owner=self.request.user).select_related("patient", "doctor__user", "clinic", "specialty") if self.request.user.is_authenticated else Appointment.objects.none()


class OwnerDoctorViewSet(mixins.CreateModelMixin, mixins.UpdateModelMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsClinicOwner]
    serializer_class = OwnerDoctorSerializer
    search_fields = ["doctor__user__first_name", "doctor__user__last_name"]
    filterset_fields = ["clinic", "is_active"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return DoctorClinic.objects.filter(clinic__owner=self.request.user).select_related("doctor__user", "clinic") if self.request.user.is_authenticated else DoctorClinic.objects.none()

    def get_serializer_class(self):
        return OwnerDoctorCreateSerializer if self.action == "create" else OwnerDoctorSerializer

    @transaction.atomic
    def perform_update(self, serializer):
        doctor = DoctorProfile.objects.select_for_update().get(pk=serializer.instance.doctor_id)
        serializer.save()
        check_existing_schedule(doctor)


class OwnerServicesView(generics.GenericAPIView):
    permission_classes = [IsClinicOwner]
    serializer_class = OwnerServicesSerializer

    def get(self, request):
        return Response({"services": ServiceSerializer(owned_clinic(request).services.all(), many=True).data})

    def patch(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        owned_clinic(request).services.set(serializer.validated_data["services"])
        return self.get(request)


class OwnerScheduleView(generics.ListAPIView):
    permission_classes = [IsClinicOwner]
    serializer_class = ScheduleSerializer

    def get_queryset(self):
        return DoctorSchedule.objects.filter(clinic__owner=self.request.user) if self.request.user.is_authenticated else DoctorSchedule.objects.none()
