from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from apps.appointments.models import Appointment
from .models import Notification


@shared_task
def create_appointment_reminders():
    now = timezone.now()
    for appointment in Appointment.objects.filter(status="confirmed", starts_at__gt=now, starts_at__lte=now + timedelta(hours=24)).iterator():
        Notification.objects.get_or_create(deduplication_key=f"reminder:{appointment.pk}:{appointment.starts_at.isoformat()}", defaults={
            "user_id": appointment.patient_id, "type": "appointment_reminder", "title": "Upcoming appointment",
            "message": f"Booking {appointment.booking_id} is scheduled within 24 hours.",
            "related_object_type": "appointment", "related_object_id": str(appointment.pk),
        })


@shared_task
def purge_expired_tokens():
    from django.core.management import call_command
    call_command("flushexpiredtokens")
