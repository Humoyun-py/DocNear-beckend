from django.db import transaction
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from apps.appointments.models import Appointment
from apps.clinics.models import Clinic
from apps.doctors.models import DoctorProfile
from .models import Review


def update_ratings(doctor_id, clinic_id):
    doctor_stats = Review.objects.filter(doctor_id=doctor_id, is_visible=True).aggregate(rating=Avg("rating"), count=Count("id"))
    clinic_stats = Review.objects.filter(clinic_id=clinic_id, is_visible=True).aggregate(rating=Avg("rating"))
    DoctorProfile.objects.filter(pk=doctor_id).update(rating=doctor_stats["rating"] or 0, total_reviews=doctor_stats["count"])
    Clinic.objects.filter(pk=clinic_id).update(rating=clinic_stats["rating"] or 0)


@transaction.atomic
def create_review(patient, data):
    appointment = get_object_or_404(Appointment.objects.select_for_update(), pk=data["appointment"].pk, patient=patient)
    if appointment.status != "completed":
        raise ValidationError("Only completed appointments can be reviewed.")
    if Review.objects.filter(appointment=appointment).exists():
        raise ValidationError("This appointment has already been reviewed.")
    return Review.objects.create(patient=patient, doctor=appointment.doctor, clinic=appointment.clinic, **data)


@transaction.atomic
def moderate_review(pk, visible=None, delete=False):
    original = Review.objects.get(pk=pk)
    Clinic.objects.select_for_update().get(pk=original.clinic_id)
    DoctorProfile.objects.select_for_update().get(pk=original.doctor_id)
    review = Review.objects.select_for_update().get(pk=pk)
    if delete:
        review.delete()
    else:
        review.is_visible = visible
        review.save(update_fields=["is_visible"])
    update_ratings(original.doctor_id, original.clinic_id)
    return review
