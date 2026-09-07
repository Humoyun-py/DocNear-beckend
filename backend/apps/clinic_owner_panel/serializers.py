from rest_framework import serializers
from apps.clinics.models import Clinic, ClinicService
from apps.doctors.models import DoctorClinic
from apps.admin_panel.serializers import DoctorManageSerializer


class OwnerClinicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = ["id", "name", "description", "logo", "cover_image", "phone", "email", "address", "latitude", "longitude", "working_hours", "facilities", "is_24_7", "has_emergency_service", "is_verified", "is_partner", "is_active", "rating"]
        read_only_fields = ["is_verified", "is_partner", "is_active", "rating"]


class OwnerDoctorCreateSerializer(DoctorManageSerializer):
    class Meta(DoctorManageSerializer.Meta):
        read_only_fields = DoctorManageSerializer.Meta.read_only_fields + ["is_verified", "is_active", "accepts_bookings"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs["clinic"].owner_id != self.context["request"].user.id:
            raise serializers.ValidationError("You can only create doctors in your own clinic.")
        return attrs


class OwnerDoctorSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="doctor.user.get_full_name", read_only=True)
    doctor_id = serializers.IntegerField(read_only=True)
    clinic_name = serializers.CharField(source="clinic.name", read_only=True)
    is_verified = serializers.BooleanField(source="doctor.is_verified", read_only=True)

    class Meta:
        model = DoctorClinic
        fields = ["id", "doctor_id", "name", "clinic", "clinic_name", "specialty", "consultation_duration", "buffer_time", "max_appointments_per_day", "is_active", "is_verified"]
        read_only_fields = ["clinic"]


class OwnerServicesSerializer(serializers.Serializer):
    services = serializers.PrimaryKeyRelatedField(queryset=ClinicService.objects.filter(is_active=True), many=True)
