from datetime import time, timedelta
from django.utils import timezone
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Clinic, ClinicImage, ClinicService


def is_open(clinic):
    if clinic.is_24_7:
        return True
    now = timezone.localtime()
    return any(time.fromisoformat(start) <= now.time() < time.fromisoformat(end) for start, end in clinic.working_hours.get(str(now.weekday()), []))


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicService
        fields = "__all__"


class ClinicImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicImage
        fields = ["id", "clinic", "image", "order", "created_at"]


class ClinicSerializer(serializers.ModelSerializer):
    distance_km = serializers.FloatField(read_only=True, default=None)
    doctor_count = serializers.SerializerMethodField()
    open_status = serializers.SerializerMethodField()
    verified_partner = serializers.SerializerMethodField()
    next_available_time = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    images = ClinicImageSerializer(many=True, read_only=True)

    class Meta:
        model = Clinic
        exclude = ["owner"]

    def get_doctor_count(self, obj) -> int:
        if hasattr(obj, "public_doctor_count"):
            return obj.public_doctor_count
        return obj.doctor_affiliations.filter(is_active=True, doctor__is_active=True, doctor__is_verified=True, doctor__user__is_active=True).count()

    def get_open_status(self, obj) -> bool:
        return is_open(obj)

    def get_verified_partner(self, obj) -> bool:
        return obj.is_partner and obj.is_verified and obj.is_active

    @extend_schema_field(ServiceSerializer(many=True))
    def get_services(self, obj):
        return ServiceSerializer([s for s in obj.services.all() if s.is_active], many=True).data

    def get_next_available_time(self, obj) -> str | None:
        from apps.schedules.services import generate_slots
        doctors = [r.doctor for r in obj.doctor_affiliations.select_related("doctor__user").filter(is_active=True, doctor__is_verified=True, doctor__is_active=True, doctor__accepts_bookings=True)]
        for offset in range(7):
            day = timezone.localdate() + timedelta(days=offset)
            times = [s["time"] for doctor in doctors for s in generate_slots(doctor, obj, day) if s["available"]]
            if times:
                return f"{day}T{min(times)}:00+05:00"
        return None


class ClinicDetailSerializer(ClinicSerializer):
    doctors = serializers.SerializerMethodField()

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_doctors(self, obj):
        from apps.doctors.models import DoctorProfile
        from apps.doctors.serializers import DoctorSerializer
        doctors = DoctorProfile.objects.public().filter(affiliations__clinic=obj, affiliations__is_active=True).select_related("user")
        return DoctorSerializer(doctors, many=True, context=self.context).data
