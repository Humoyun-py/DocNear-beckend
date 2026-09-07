from datetime import timedelta
from django.utils import timezone
from django_filters import rest_framework as filters
from .models import Appointment


class AppointmentFilter(filters.FilterSet):
    date = filters.DateFilter(field_name="appointment_date")
    booking_id = filters.CharFilter(lookup_expr="icontains")
    upcoming = filters.BooleanFilter(method="filter_upcoming")
    past = filters.BooleanFilter(method="filter_past")
    cancelled = filters.BooleanFilter(method="filter_cancelled")
    today = filters.BooleanFilter(method="filter_today")
    tomorrow = filters.BooleanFilter(method="filter_tomorrow")
    this_week = filters.BooleanFilter(method="filter_week")

    class Meta:
        model = Appointment
        fields = ["status", "doctor", "clinic", "patient", "specialty"]

    def filter_upcoming(self, qs, name, value):
        return qs.filter(starts_at__gte=timezone.now(), status__in=["pending", "confirmed", "waiting"]) if value else qs

    def filter_past(self, qs, name, value):
        return qs.filter(starts_at__lt=timezone.now()) if value else qs

    def filter_cancelled(self, qs, name, value):
        return qs.filter(status="cancelled") if value else qs

    def filter_today(self, qs, name, value):
        return qs.filter(appointment_date=timezone.localdate()) if value else qs

    def filter_tomorrow(self, qs, name, value):
        return qs.filter(appointment_date=timezone.localdate() + timedelta(days=1)) if value else qs

    def filter_week(self, qs, name, value):
        today = timezone.localdate()
        start = today - timedelta(days=today.weekday())
        return qs.filter(appointment_date__gte=start, appointment_date__lt=start + timedelta(days=7)) if value else qs
