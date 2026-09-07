from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import DoctorProfile, DoctorClinic


class AffiliationSerializer(serializers.ModelSerializer):
    clinic_name = serializers.CharField(source="clinic.name", read_only=True)
    specialty_name = serializers.CharField(source="specialty.name", read_only=True)
    latitude = serializers.FloatField(source="clinic.latitude", read_only=True)
    longitude = serializers.FloatField(source="clinic.longitude", read_only=True)

    class Meta:
        model = DoctorClinic
        fields = ["id", "clinic", "clinic_name", "specialty", "specialty_name", "latitude", "longitude", "is_primary", "consultation_duration", "buffer_time", "max_appointments_per_day", "is_active"]


class DoctorSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.get_full_name", read_only=True)
    affiliations = serializers.SerializerMethodField()
    distance_km = serializers.FloatField(read_only=True, default=None)
    next_available_time = serializers.CharField(read_only=True, default=None)

    class Meta:
        model = DoctorProfile
        exclude = ["user", "pending_profile"]

    @extend_schema_field(AffiliationSerializer(many=True))
    def get_affiliations(self, obj):
        links = obj.affiliations.select_related("clinic", "specialty").filter(is_active=True, clinic__is_partner=True, clinic__is_active=True, clinic__is_verified=True, specialty__is_active=True)
        return AffiliationSerializer(links, many=True).data


class DoctorProfileEditSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = DoctorProfile
        fields = ["id", "name", "profile_image", "bio", "experience_years", "education", "certifications", "languages", "pending_profile", "is_verified", "is_active", "accepts_bookings"]
        read_only_fields = ["id", "pending_profile", "is_verified", "is_active", "accepts_bookings"]

    def update(self, instance, validated_data):
        pending = dict(instance.pending_profile)
        for field in ("education", "certifications", "experience_years"):
            if field in validated_data:
                pending[field] = validated_data.pop(field)
        validated_data["pending_profile"] = pending
        return super().update(instance, validated_data)


class AvailabilityQuerySerializer(serializers.Serializer):
    date = serializers.DateField()
    clinic_id = serializers.IntegerField(min_value=1)

    def validate_date(self, value):
        from datetime import timedelta
        from django.utils import timezone
        if not timezone.localdate() <= value <= timezone.localdate() + timedelta(days=180):
            raise serializers.ValidationError("Choose a date within the next 180 days.")
        return value


class SlotSerializer(serializers.Serializer):
    time = serializers.CharField()
    end_time = serializers.CharField()
    available = serializers.BooleanField()


class AvailabilitySerializer(serializers.Serializer):
    date = serializers.DateField()
    doctor = DoctorSerializer()
    clinic = serializers.DictField()
    slots = SlotSerializer(many=True)
