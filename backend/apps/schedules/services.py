from datetime import datetime, time, timedelta
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from common.exceptions import Conflict
from apps.doctors.models import DoctorClinic, DoctorProfile
from apps.clinics.models import Clinic
from apps.appointments.models import Appointment, OCCUPYING_STATUSES, ACTIVE_STATUSES
from .models import DoctorSchedule, DoctorBreak, BlockedTime


def local_datetime(day, at):
    return timezone.make_aware(datetime.combine(day, at), timezone.get_default_timezone())


def overlaps(a, b, c, d):
    return a < d and c < b


def generate_slots(doctor, clinic, day, *, exclude_appointment=None, check_public=True, now=None):
    now = now or timezone.now()
    if check_public and not (doctor.is_verified and doctor.is_active and doctor.accepts_bookings and doctor.user.is_active
                             and clinic.is_active and clinic.is_partner and clinic.is_verified):
        return []
    relation = DoctorClinic.objects.filter(doctor=doctor, clinic=clinic, is_active=True, specialty__is_active=True).first()
    if not relation:
        return []
    schedule = DoctorSchedule.objects.filter(doctor=doctor, clinic=clinic, day_of_week=day.weekday(), is_working=True).first()
    if not schedule:
        return []
    clinic_hours = [["00:00", "23:59:59"]] if clinic.is_24_7 else clinic.working_hours.get(str(day.weekday()), [])
    breaks = list(DoctorBreak.objects.filter(doctor=doctor).filter(Q(date=day) | Q(weekday=day.weekday(), date__isnull=True)))
    day_start, day_end = local_datetime(day, time.min), local_datetime(day + timedelta(days=1), time.min)
    blocks = list(BlockedTime.objects.filter(doctor=doctor, start_datetime__lt=day_end, end_datetime__gt=day_start))
    appointments = list(Appointment.objects.filter(doctor=doctor, status__in=OCCUPYING_STATUSES, starts_at__lt=day_end, reserved_until__gt=day_start).exclude(pk=exclude_appointment))
    limit_reached = sum(a.clinic_id == clinic.id and a.appointment_date == day for a in appointments) >= relation.max_appointments_per_day
    duration = timedelta(minutes=relation.consultation_duration)
    step = duration + timedelta(minutes=relation.buffer_time)
    cursor, end = local_datetime(day, schedule.start_time), local_datetime(day, schedule.end_time)
    slots = []
    while cursor + duration <= end:
        finish, reserved = cursor + duration, cursor + step
        within_clinic = any(local_datetime(day, time.fromisoformat(start)) <= cursor and finish <= local_datetime(day, time.fromisoformat(stop)) for start, stop in clinic_hours)
        unavailable = (cursor <= now or limit_reached or not within_clinic
                       or any(overlaps(cursor, reserved, local_datetime(day, b.start_time), local_datetime(day, b.end_time)) for b in breaks)
                       or any(overlaps(cursor, reserved, b.start_datetime, b.end_datetime) for b in blocks)
                       or any(overlaps(cursor, reserved, a.starts_at, a.reserved_until) for a in appointments))
        slots.append({"time": cursor.strftime("%H:%M"), "end_time": finish.strftime("%H:%M"), "available": not unavailable})
        cursor += step
    return slots


def validate_booking_slot(doctor, clinic, day, at, exclude_appointment=None):
    if day < timezone.localdate() or day > timezone.localdate() + timedelta(days=180):
        raise ValidationError({"date": "Choose a date within the next 180 days."})
    if at.second or at.microsecond or at.tzinfo:
        raise ValidationError({"time": "Use a whole-minute local time (HH:MM)."})
    slots = generate_slots(doctor, clinic, day, exclude_appointment=exclude_appointment)
    if not any(slot["time"] == at.strftime("%H:%M") and slot["available"] for slot in slots):
        raise Conflict()
    return DoctorClinic.objects.get(doctor=doctor, clinic=clinic, is_active=True)


def check_existing_schedule(doctor):
    """Called under the same doctor lock as booking; a rejected edit rolls back."""
    for appointment in Appointment.objects.filter(doctor=doctor, status__in=ACTIVE_STATUSES, reserved_until__gt=timezone.now()).select_related("clinic"):
        slots = generate_slots(doctor, appointment.clinic, appointment.appointment_date,
                               exclude_appointment=appointment.pk, check_public=False,
                               now=min(timezone.now(), appointment.starts_at - timedelta(seconds=1)))
        if not any(s["available"] and s["time"] == appointment.start_time.strftime("%H:%M") and s["end_time"] == appointment.end_time.strftime("%H:%M") for s in slots):
            raise Conflict("This schedule change conflicts with an existing appointment.", code="schedule_conflict")


@transaction.atomic
def save_schedule_item(serializer, doctor):
    DoctorProfile.objects.select_for_update().get(pk=doctor.pk)
    clinic = serializer.validated_data.get("clinic", getattr(serializer.instance, "clinic", None))
    if not DoctorClinic.objects.filter(doctor=doctor, clinic=clinic, is_active=True).exists():
        raise ValidationError({"clinic": "You are not assigned to this clinic."})
    item = serializer.save(doctor=doctor)
    check_existing_schedule(doctor)
    return item


@transaction.atomic
def update_weekly_schedule(doctor, data):
    from .serializers import ScheduleSerializer, BookingPolicySerializer, BookingPolicyInputSerializer
    DoctorProfile.objects.select_for_update().get(pk=doctor.pk)
    for row in data.get("schedules", []):
        serializer = ScheduleSerializer(data=row)
        serializer.is_valid(raise_exception=True)
        clinic = serializer.validated_data["clinic"]
        serializer.instance = DoctorSchedule.objects.filter(doctor=doctor, clinic=clinic, day_of_week=serializer.validated_data["day_of_week"]).first()
        if not DoctorClinic.objects.filter(doctor=doctor, clinic=clinic, is_active=True).exists():
            raise ValidationError({"clinic": "You are not assigned to this clinic."})
        serializer.save(doctor=doctor)
    for row in data.get("policies", []):
        policy = BookingPolicyInputSerializer(data=row)
        policy.is_valid(raise_exception=True)
        relation = DoctorClinic.objects.filter(doctor=doctor, clinic_id=policy.validated_data["clinic"]).first()
        if not relation:
            raise ValidationError({"clinic": "You are not assigned to this clinic."})
        serializer = BookingPolicySerializer(relation, data=row, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
    check_existing_schedule(doctor)
    from apps.notifications.models import Notification
    patient_ids = Appointment.objects.filter(doctor=doctor, status__in=ACTIVE_STATUSES, starts_at__gte=timezone.now()).values_list("patient_id", flat=True).distinct()
    Notification.objects.bulk_create([Notification(user_id=p, type="doctor_schedule_changed", title="Doctor schedule updated", message="Your existing appointment remains scheduled.") for p in patient_ids])


@transaction.atomic
def update_clinic(serializer):
    clinic = Clinic.objects.select_for_update().get(pk=serializer.instance.pk)
    doctors = list(DoctorProfile.objects.filter(affiliations__clinic=clinic).order_by("pk").select_for_update(of=("self",)))
    serializer.instance = clinic
    result = serializer.save()
    if "working_hours" in serializer.validated_data or "is_24_7" in serializer.validated_data:
        for doctor in doctors:
            check_existing_schedule(doctor)
    return result
