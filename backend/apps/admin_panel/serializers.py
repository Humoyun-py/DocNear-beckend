from django.db import transaction
from rest_framework import serializers
from apps.accounts.models import User
from apps.accounts.serializers import RegisterSerializer, UserSerializer
from apps.clinics.models import Clinic
from apps.doctors.models import DoctorProfile, DoctorClinic
from apps.doctors.serializers import AffiliationSerializer
from apps.specialties.models import Specialty
from .models import PlatformSettings, AuditLog


class ClinicManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = "__all__"
        read_only_fields = ["rating"]

    def validate_owner(self, user):
        if user.role != "clinic_owner":
            raise serializers.ValidationError("The clinic owner must have a clinic owner account.")
        return user


class StaffAccountSerializer(RegisterSerializer):
    def create(self, validated_data):
        return User.objects.create_user(**validated_data, role=self.context["account_role"])


class DoctorManageSerializer(serializers.ModelSerializer):
    account = StaffAccountSerializer(write_only=True, required=False)
    name = serializers.CharField(source="user.get_full_name", read_only=True)
    affiliations = AffiliationSerializer(many=True, read_only=True)
    clinic = serializers.PrimaryKeyRelatedField(queryset=Clinic.objects.all(), write_only=True, required=False)
    specialty = serializers.PrimaryKeyRelatedField(queryset=Specialty.objects.all(), write_only=True, required=False)

    class Meta:
        model = DoctorProfile
        fields = "__all__"
        read_only_fields = ["user", "rating", "total_reviews", "pending_profile"]

    def validate(self, attrs):
        if not self.instance and not all(key in attrs for key in ["account", "clinic", "specialty"]):
            raise serializers.ValidationError("New doctors require account, clinic and specialty.")
        if self.instance and "account" in attrs:
            raise serializers.ValidationError("Doctor login identifiers cannot be changed here.")
        if ("clinic" in attrs) != ("specialty" in attrs):
            raise serializers.ValidationError("Provide clinic and specialty together.")
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        account = validated_data.pop("account")
        clinic, specialty = validated_data.pop("clinic"), validated_data.pop("specialty")
        user = User.objects.create_user(**account, role="doctor")
        doctor = DoctorProfile.objects.create(user=user, **validated_data)
        DoctorClinic.objects.create(doctor=doctor, clinic=clinic, specialty=specialty, is_primary=True)
        return doctor

    def update(self, instance, validated_data):
        clinic, specialty = validated_data.pop("clinic", None), validated_data.pop("specialty", None)
        if clinic:
            DoctorClinic.objects.update_or_create(doctor=instance, clinic=clinic, defaults={"specialty": specialty})
        return super().update(instance, validated_data)


class AdminPatientSerializer(UserSerializer):
    booking_count = serializers.IntegerField(read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["booking_count"]


class AdminUserCreateSerializer(StaffAccountSerializer):
    def create(self, validated_data):
        return User.objects.create_user(**validated_data, role="admin")


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = ["support_email", "support_phone", "maintenance_message"]


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = "__all__"
