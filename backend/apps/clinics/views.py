from django.db.models import Q, Count
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from common.geo import nearby, NearbyQuerySerializer
from .models import Clinic, ClinicService
from .serializers import ClinicSerializer, ClinicDetailSerializer, ServiceSerializer, is_open


class ClinicFilter(filters.FilterSet):
    rating = filters.NumberFilter(field_name="rating", lookup_expr="gte")
    service = filters.NumberFilter(field_name="services")
    emergency = filters.BooleanFilter(method="filter_emergency")

    class Meta:
        model = Clinic
        fields = ["is_partner"]

    def filter_emergency(self, qs, name, value):
        return qs.filter(Q(has_emergency_service=True) | Q(is_24_7=True)) if value else qs


class ClinicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ClinicSerializer
    filterset_class = ClinicFilter
    search_fields = ["name", "address", "services__name"]
    ordering_fields = ["name", "rating"]

    def get_queryset(self):
        qs = Clinic.objects.public().prefetch_related("services", "images").annotate(public_doctor_count=Count("doctor_affiliations", filter=Q(doctor_affiliations__is_active=True, doctor_affiliations__doctor__is_active=True, doctor_affiliations__doctor__is_verified=True, doctor_affiliations__doctor__user__is_active=True), distinct=True))
        if self.action == "emergency":
            qs = qs.filter(Q(has_emergency_service=True) | Q(is_24_7=True))
        if self.action == "nearby" or (self.action == "emergency" and any(key in self.request.query_params for key in ["latitude", "longitude", "radius"])):
            qs = nearby(qs, self.request.query_params)
        if self.request.query_params.get("open_now") == "true":
            qs = qs.filter(pk__in=[c.pk for c in qs if is_open(c)])
        return qs if qs.ordered else qs.order_by("name", "id")

    def get_serializer_class(self):
        return ClinicDetailSerializer if self.action == "retrieve" else ClinicSerializer

    @extend_schema(parameters=[NearbyQuerySerializer])
    @action(detail=False)
    def nearby(self, request):
        return self.list(request)

    @extend_schema(parameters=[NearbyQuerySerializer])
    @action(detail=False)
    def emergency(self, request):
        return self.list(request)


class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ServiceSerializer
    queryset = ClinicService.objects.filter(is_active=True)
