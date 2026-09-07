from datetime import timedelta
from django.db.models import Q, FilteredRelation, Subquery
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, generics, serializers
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from common.geo import nearby, NearbyQuerySerializer
from apps.clinics.models import Clinic
from apps.clinics.serializers import ClinicSerializer
from apps.specialties.models import Specialty
from apps.specialties.serializers import SpecialtySerializer
from apps.schedules.services import generate_slots
from .models import DoctorProfile, DoctorClinic
from .serializers import DoctorSerializer, AvailabilityQuerySerializer, AvailabilitySerializer


class DoctorFilter(filters.FilterSet):
    specialty = filters.NumberFilter(field_name="public_affiliation__specialty")
    clinic = filters.NumberFilter(field_name="public_affiliation__clinic")
    rating = filters.NumberFilter(field_name="rating", lookup_expr="gte")

    class Meta:
        model = DoctorProfile
        fields = ["is_active", "is_verified", "accepts_bookings"]


class PublicDoctorSearchFilter(SearchFilter):
    def must_call_distinct(self, queryset, search_fields):
        # Public-affiliation aliases are joins, not DoctorProfile model fields.
        return True


class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    filter_backends = [filters.DjangoFilterBackend, PublicDoctorSearchFilter, OrderingFilter]
    permission_classes = [AllowAny]
    serializer_class = DoctorSerializer
    filterset_class = DoctorFilter
    search_fields = ["user__first_name", "user__last_name", "public_affiliation__specialty__name", "public_affiliation__specialty__search_aliases"]
    ordering_fields = ["rating", "experience_years", "id"]

    def get_queryset(self):
        public_links = DoctorClinic.objects.filter(is_active=True, clinic__is_active=True, clinic__is_partner=True, clinic__is_verified=True, specialty__is_active=True)
        return DoctorProfile.objects.public().annotate(public_affiliation=FilteredRelation("affiliations", condition=Q(affiliations__pk__in=Subquery(public_links.values("pk"))))).select_related("user").prefetch_related("affiliations__clinic", "affiliations__specialty")

    @extend_schema(parameters=[AvailabilityQuerySerializer], responses=AvailabilitySerializer)
    @action(detail=True)
    def availability(self, request, pk=None):
        doctor = self.get_object()
        query = AvailabilityQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        day = query.validated_data["date"]
        clinic = get_object_or_404(Clinic.objects.public(), pk=query.validated_data["clinic_id"], doctor_affiliations__doctor=doctor, doctor_affiliations__is_active=True)
        return Response({"date": day, "doctor": DoctorSerializer(doctor, context={"request": request}).data,
                         "clinic": {"id": clinic.pk, "name": clinic.name}, "slots": generate_slots(doctor, clinic, day)})

    @extend_schema(parameters=[NearbyQuerySerializer])
    @action(detail=False)
    def nearby(self, request):
        clinics = list(nearby(Clinic.objects.public(), request.query_params))
        distances = {c.pk: c.distance_km for c in clinics}
        clinic_map = {c.pk: c for c in clinics}
        doctors = self.filter_queryset(self.get_queryset()).filter(affiliations__clinic_id__in=distances, affiliations__is_active=True).distinct()
        result = []
        for doctor in doctors:
            links = [r for r in doctor.affiliations.all() if r.is_active and r.clinic_id in distances]
            if not links:
                continue
            doctor.distance_km = min(distances[r.clinic_id] for r in links)
            doctor.next_available_time = None
            for offset in range(7):
                day = timezone.localdate() + timedelta(days=offset)
                times = [s["time"] for r in links for s in generate_slots(doctor, clinic_map[r.clinic_id], day) if s["available"]]
                if times:
                    doctor.next_available_time = f"{day}T{min(times)}:00+05:00"
                    break
            availability = request.query_params.get("availability")
            if availability in {"true", "today"} and not (doctor.next_available_time and doctor.next_available_time.startswith(str(timezone.localdate()))):
                continue
            result.append(doctor)
        result.sort(key=lambda d: (d.distance_km, d.next_available_time or "9999", -d.rating))
        page = self.paginate_queryset(result)
        return self.get_paginated_response(self.get_serializer(page, many=True).data)


class SpecialtyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = SpecialtySerializer
    queryset = Specialty.objects.filter(is_active=True)


class SearchQuerySerializer(serializers.Serializer):
    q = serializers.CharField(max_length=100, allow_blank=True, required=False)


class SearchView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = SearchQuerySerializer

    @extend_schema(parameters=[SearchQuerySerializer], responses=dict)
    def get(self, request):
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        q = serializer.validated_data.get("q", "").strip()
        if not q:
            return Response({"doctors": [], "clinics": [], "specialties": []})
        specialties = Specialty.objects.filter(is_active=True).filter(Q(name__icontains=q) | Q(search_aliases__icontains=q))
        matching_links = DoctorClinic.objects.filter(is_active=True, clinic__is_active=True, clinic__is_partner=True, clinic__is_verified=True, specialty__in=specialties)
        doctors = DoctorProfile.objects.public().filter(Q(user__first_name__icontains=q) | Q(user__last_name__icontains=q) | Q(pk__in=matching_links.values("doctor_id"))).distinct()
        clinics = Clinic.objects.public().filter(Q(name__icontains=q) | Q(address__icontains=q) | Q(services__name__icontains=q) | Q(doctor_affiliations__specialty__in=specialties, doctor_affiliations__is_active=True)).distinct()
        context = {"request": request}
        return Response({"doctors": DoctorSerializer(doctors[:20], many=True, context=context).data,
                         "clinics": ClinicSerializer(clinics[:20], many=True, context=context).data,
                         "specialties": SpecialtySerializer(specialties[:20], many=True).data})
