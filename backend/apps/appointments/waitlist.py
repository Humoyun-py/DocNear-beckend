from datetime import timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import mixins, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.clinics.models import Clinic
from apps.doctors.models import DoctorProfile, DoctorClinic
from apps.schedules.services import generate_slots
from common.permissions import IsPatient
from .models import Appointment, WaitlistEntry


class WaitlistSerializer(serializers.ModelSerializer):
    doctor = serializers.PrimaryKeyRelatedField(queryset=DoctorProfile.objects.public())
    clinic = serializers.PrimaryKeyRelatedField(queryset=Clinic.objects.public())
    doctor_name = serializers.CharField(source="doctor.user.get_full_name", read_only=True)
    clinic_name = serializers.CharField(source="clinic.name", read_only=True)
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    available_slot = serializers.SerializerMethodField()

    class Meta:
        model = WaitlistEntry
        fields = ["id", "doctor", "clinic", "doctor_name", "clinic_name", "patient_name", "preferred_date", "time_range", "notes", "status", "available_slot", "created_at"]
        read_only_fields = ["status", "created_at"]
        validators = []

    def validate(self, attrs):
        if not timezone.localdate() <= attrs["preferred_date"] <= timezone.localdate() + timedelta(days=180):
            raise serializers.ValidationError({"preferred_date": "Choose a date within the next 180 days."})
        if not DoctorClinic.objects.filter(doctor=attrs["doctor"], clinic=attrs["clinic"], is_active=True).exists():
            raise serializers.ValidationError({"doctor": "Doctor is not assigned to this clinic."})
        return attrs

    def get_available_slot(self, entry) -> dict | None:
        if entry.status != "waiting" or entry.preferred_date < timezone.localdate():
            return None
        if not DoctorProfile.objects.public().filter(pk=entry.doctor_id, accepts_bookings=True).exists():
            return None
        if not Clinic.objects.public().filter(pk=entry.clinic_id).exists():
            return None
        for slot in generate_slots(entry.doctor, entry.clinic, entry.preferred_date):
            hour = int(slot["time"][:2])
            matches = entry.time_range == "any" or (entry.time_range == "morning" and hour < 12) or (entry.time_range == "afternoon" and 12 <= hour < 17) or (entry.time_range == "evening" and hour >= 17)
            if slot["available"] and matches:
                return {"date": str(entry.preferred_date), "time": slot["time"]}
        return None


class WaitlistViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsPatient]
    serializer_class = WaitlistSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return WaitlistEntry.objects.none()
        return WaitlistEntry.objects.filter(patient=self.request.user).select_related("doctor__user", "clinic", "patient")

    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                serializer.save(patient=self.request.user)
        except IntegrityError:
            raise serializers.ValidationError("You already joined this waitlist.")

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        item = self.get_object()
        item.status = "cancelled"
        item.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(item).data)

    @action(detail=True, methods=["post"], url_path="mark-booked")
    def mark_booked(self, request, pk=None):
        item = self.get_object()
        if not Appointment.objects.filter(patient=request.user, doctor=item.doctor, clinic=item.clinic,
                appointment_date=item.preferred_date, status__in=["pending", "confirmed", "waiting", "in_progress", "completed"]).exists():
            raise serializers.ValidationError("Create an appointment before marking this entry booked.")
        item.status = "booked"
        item.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(item).data)
