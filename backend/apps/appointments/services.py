from datetime import timedelta
from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from apps.clinics.models import Clinic
from apps.doctors.models import DoctorProfile
from apps.schedules.services import validate_booking_slot, local_datetime
from apps.notifications.models import Notification
from common.exceptions import Conflict
from common.permissions import is_admin
from .models import Appointment, AppointmentEvent

TRANSITIONS = {
    "pending": {"confirmed", "rejected", "cancelled"},
    "confirmed": {"waiting", "cancelled", "no_show"},
    "waiting": {"in_progress", "no_show"},
    "in_progress": {"completed"},
}


def notify(appointment, action):
    notification_type = {"created": "booking_created", "confirmed": "booking_confirmed", "cancelled": "booking_cancelled", "rescheduled": "booking_rescheduled"}.get(action, "booking_updated")
    # No medical notes, names or contact details in notification messages.
    Notification.objects.bulk_create([Notification(user_id=user_id, type=notification_type,
        title="Appointment " + action.replace("_", " "), message=f"Booking {appointment.booking_id}: {appointment.status}.",
        related_object_type="appointment", related_object_id=str(appointment.pk))
        for user_id in {appointment.patient_id, appointment.doctor.user_id}])


def authorize(actor, appointment):
    if is_admin(actor) or (actor.role == "doctor" and appointment.doctor.user_id == actor.pk) or (actor.role == "patient" and appointment.patient_id == actor.pk):
        return
    raise PermissionDenied("You cannot manage this appointment.")


def set_times(appointment, day, at, relation):
    appointment.appointment_date = day
    appointment.start_time = at
    appointment.starts_at = local_datetime(day, at)
    appointment.ends_at = appointment.starts_at + timedelta(minutes=relation.consultation_duration)
    appointment.end_time = timezone.localtime(appointment.ends_at).time()
    appointment.reserved_until = appointment.ends_at + timedelta(minutes=relation.buffer_time)


@transaction.atomic
def create_booking(actor, *, doctor_id, clinic_id, date, time, patient_note=""):
    if actor.role != "patient" or not actor.is_active:
        raise PermissionDenied("Only active patient accounts can create bookings.")
    # Lock ordering: clinic -> doctor -> appointment, used by schedule and panel writes too.
    clinic = get_object_or_404(Clinic.objects.select_for_update(), pk=clinic_id)
    doctor = get_object_or_404(DoctorProfile.objects.select_for_update(), pk=doctor_id)
    relation = validate_booking_slot(doctor, clinic, date, time)
    appointment = Appointment(patient=actor, doctor=doctor, clinic=clinic, specialty=relation.specialty, patient_note=patient_note)
    set_times(appointment, date, time, relation)
    try:
        with transaction.atomic():
            appointment.save()
    except IntegrityError as exc:
        raise Conflict() from exc
    AppointmentEvent.objects.create(appointment=appointment, actor=actor, action="created", to_status=appointment.status)
    notify(appointment, "created")
    return appointment


def lock_appointment(pk):
    original = get_object_or_404(Appointment, pk=pk)
    Clinic.objects.select_for_update().get(pk=original.clinic_id)
    DoctorProfile.objects.select_for_update().get(pk=original.doctor_id)
    return Appointment.objects.select_for_update().select_related("doctor__user", "clinic").get(pk=pk)


@transaction.atomic
def transition(actor, pk, target, reason=""):
    appointment = lock_appointment(pk)
    authorize(actor, appointment)
    if actor.role == "patient" and target != "cancelled":
        raise PermissionDenied("Patients can only cancel their appointments.")
    if target not in TRANSITIONS.get(appointment.status, set()):
        raise Conflict(f"Cannot change {appointment.status} to {target}.", code="invalid_status_transition")
    if target in {"waiting", "in_progress", "completed", "no_show"} and appointment.starts_at > timezone.now():
        raise Conflict("This appointment has not started yet.", code="appointment_not_started")
    before = appointment.status
    appointment.status = target
    if target in {"cancelled", "rejected"}:
        appointment.cancel_reason = reason
    appointment.save(update_fields=["status", "cancel_reason", "updated_at"])
    AppointmentEvent.objects.create(appointment=appointment, actor=actor, action=target, from_status=before, to_status=target)
    notify(appointment, target)
    return appointment


@transaction.atomic
def reschedule(actor, pk, *, date, time):
    appointment = lock_appointment(pk)
    authorize(actor, appointment)
    if appointment.status not in {"pending", "confirmed"}:
        raise Conflict("This appointment cannot be rescheduled.", code="invalid_status_transition")
    relation = validate_booking_slot(appointment.doctor, appointment.clinic, date, time, appointment.pk)
    before = appointment.status
    set_times(appointment, date, time, relation)
    appointment.status = "pending"
    try:
        with transaction.atomic():
            appointment.save()
    except IntegrityError as exc:
        raise Conflict() from exc
    AppointmentEvent.objects.create(appointment=appointment, actor=actor, action="rescheduled", from_status=before, to_status="pending")
    notify(appointment, "rescheduled")
    return appointment


@transaction.atomic
def start_appointment(actor, pk):
    appointment = lock_appointment(pk)
    authorize(actor, appointment)
    # The panel's Start action includes check-in, preserving the audited state sequence.
    if appointment.status == "confirmed":
        transition(actor, pk, "waiting")
    return transition(actor, pk, "in_progress")
