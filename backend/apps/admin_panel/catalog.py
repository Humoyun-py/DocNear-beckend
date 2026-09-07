from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from apps.clinics.models import Clinic, ClinicService, ClinicImage
from apps.clinics.serializers import ServiceSerializer, ClinicImageSerializer
from apps.doctors.models import DoctorProfile, DoctorClinic
from apps.doctors.serializers import AffiliationSerializer
from apps.specialties.models import Specialty
from apps.specialties.serializers import SpecialtySerializer
from apps.schedules.services import update_clinic, check_existing_schedule
from apps.notifications.models import Notification
from .base import AdminModelViewSet, audit
from .serializers import ClinicManageSerializer, DoctorManageSerializer


class ClinicAdminViewSet(AdminModelViewSet):
    serializer_class = ClinicManageSerializer
    queryset = Clinic.objects.all().prefetch_related("services")
    filterset_fields = ["is_partner", "is_verified", "is_active", "owner"]
    search_fields = ["name", "address"]
    ordering_fields = ["name", "created_at", "rating"]

    def perform_update(self, serializer):
        audit(self.request, "updated", update_clinic(serializer))

    @transaction.atomic
    def set_flag(self, request, field, value):
        clinic = Clinic.objects.select_for_update().get(pk=self.get_object().pk)
        setattr(clinic, field, value)
        clinic.save(update_fields=[field, "updated_at"])
        audit(request, f"{field}:{value}", clinic)
        if field == "is_verified":
            Notification.objects.create(user=clinic.owner, type="clinic_verification", title="Clinic verified", message=f"{clinic.name} has been verified.")
        return Response(self.get_serializer(clinic).data)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        return self.set_flag(request, "is_verified", True)

    @action(detail=True, methods=["post"])
    def disable(self, request, pk=None):
        return self.set_flag(request, "is_active", False)

    @action(detail=True, methods=["post"])
    def enable(self, request, pk=None):
        return self.set_flag(request, "is_active", True)

    @action(detail=True, methods=["post"], url_path="mark-partner")
    def mark_partner(self, request, pk=None):
        return self.set_flag(request, "is_partner", True)

    @action(detail=True, methods=["post"], url_path="remove-partner")
    def remove_partner(self, request, pk=None):
        return self.set_flag(request, "is_partner", False)

    def destroy(self, request, *args, **kwargs):
        return self.set_flag(request, "is_active", False)


class DoctorAdminViewSet(AdminModelViewSet):
    serializer_class = DoctorManageSerializer
    queryset = DoctorProfile.objects.select_related("user").prefetch_related("affiliations")
    filterset_fields = ["is_verified", "is_active", "accepts_bookings", "affiliations__clinic", "affiliations__specialty"]
    search_fields = ["user__first_name", "user__last_name"]
    ordering_fields = ["created_at", "rating"]

    @transaction.atomic
    def perform_update(self, serializer):
        serializer.instance = DoctorProfile.objects.select_for_update().get(pk=serializer.instance.pk)
        audit(self.request, "updated", serializer.save())

    @transaction.atomic
    def set_flag(self, request, field, value):
        doctor = DoctorProfile.objects.select_for_update().get(pk=self.get_object().pk)
        setattr(doctor, field, value)
        if field == "is_verified" and value:
            for key, val in doctor.pending_profile.items():
                if key in {"education", "certifications", "experience_years"}:
                    setattr(doctor, key, val)
            doctor.pending_profile = {}
            Notification.objects.create(user=doctor.user, type="doctor_verification", title="Profile verified", message="Your professional profile has been approved.")
        doctor.save()
        audit(request, f"{field}:{value}", doctor)
        return Response(self.get_serializer(doctor).data)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        return self.set_flag(request, "is_verified", True)

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        return self.set_flag(request, "is_active", False)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        return self.set_flag(request, "is_active", True)

    def destroy(self, request, *args, **kwargs):
        return self.set_flag(request, "is_active", False)


class SpecialtyAdminViewSet(AdminModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    search_fields = ["name", "search_aliases"]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
        audit(self.request, "disabled", instance)


class ServiceAdminViewSet(SpecialtyAdminViewSet):
    queryset = ClinicService.objects.all()
    serializer_class = ServiceSerializer
    search_fields = ["name"]


class ClinicImageAdminViewSet(AdminModelViewSet):
    queryset = ClinicImage.objects.all()
    serializer_class = ClinicImageSerializer
    filterset_fields = ["clinic"]


class AffiliationManageSerializer(AffiliationSerializer):
    class Meta(AffiliationSerializer.Meta):
        fields = AffiliationSerializer.Meta.fields + ["doctor"]

    def validate(self, attrs):
        if self.instance and any(k in attrs and attrs[k].pk != getattr(self.instance, f"{k}_id") for k in ["doctor", "clinic"]):
            raise ValidationError("Doctor and clinic cannot be reassigned; create a new affiliation.")
        return attrs


class AffiliationAdminViewSet(AdminModelViewSet):
    queryset = DoctorClinic.objects.select_related("doctor", "clinic", "specialty")
    serializer_class = AffiliationManageSerializer
    filterset_fields = ["doctor", "clinic"]

    @transaction.atomic
    def perform_update(self, serializer):
        doctor = DoctorProfile.objects.select_for_update().get(pk=serializer.instance.doctor_id)
        instance = serializer.save()
        check_existing_schedule(doctor)
        audit(self.request, "updated", instance)

    def perform_destroy(self, instance):
        if instance.doctor.appointments.filter(clinic=instance.clinic, starts_at__gte=timezone.now(), status__in=["pending", "confirmed", "waiting", "in_progress"]).exists():
            raise ValidationError("Resolve upcoming appointments before removing the affiliation.")
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
        audit(self.request, "disabled", instance)
