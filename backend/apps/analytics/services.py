from datetime import timedelta
from django.db.models import Count
from django.utils import timezone


def appointment_analytics(queryset):
    today = timezone.localdate()
    start = today - timedelta(days=29)
    recent = queryset.filter(appointment_date__gte=start, appointment_date__lte=today)
    by_status = dict(queryset.values("status").annotate(count=Count("id")).values_list("status", "count"))
    daily = dict(recent.values("appointment_date").annotate(count=Count("id")).values_list("appointment_date", "count"))
    count = queryset.count()
    return {
        "total_appointments": count, "today_appointments": queryset.filter(appointment_date=today).count(),
        "daily_appointments": [{"date": str(start + timedelta(days=i)), "count": daily.get(start + timedelta(days=i), 0)} for i in range(30)],
        "weekly_appointments": queryset.filter(appointment_date__gte=today - timedelta(days=today.weekday()), appointment_date__lte=today).count(),
        "monthly_appointments": queryset.filter(appointment_date__gte=today.replace(day=1), appointment_date__lte=today).count(),
        "by_status": by_status, "completed_count": by_status.get("completed", 0), "cancelled_count": by_status.get("cancelled", 0),
        "no_show_count": by_status.get("no_show", 0), "pending_count": by_status.get("pending", 0), "confirmed_count": by_status.get("confirmed", 0),
        "completion_rate": round(by_status.get("completed", 0) / count * 100, 1) if count else 0,
        "average_appointments_per_day": round(recent.count() / 30, 2),
        "patient_count": queryset.values("patient").distinct().count(),
    }
