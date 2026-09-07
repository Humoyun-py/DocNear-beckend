from django.db import models
from django.core.validators import MaxValueValidator


class DoctorSchedule(models.Model):
    doctor = models.ForeignKey("doctors.DoctorProfile", on_delete=models.CASCADE, related_name="schedules")
    clinic = models.ForeignKey("clinics.Clinic", on_delete=models.CASCADE)
    day_of_week = models.PositiveSmallIntegerField(validators=[MaxValueValidator(6)])
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_working = models.BooleanField(default=True)

    class Meta:
        ordering = ["day_of_week", "start_time"]
        constraints = [
            models.UniqueConstraint(fields=["doctor", "clinic", "day_of_week"], name="unique_doctor_clinic_weekday"),
            models.CheckConstraint(condition=models.Q(start_time__lt=models.F("end_time"), day_of_week__lte=6), name="valid_schedule_interval"),
        ]


class DoctorBreak(models.Model):
    doctor = models.ForeignKey("doctors.DoctorProfile", on_delete=models.CASCADE, related_name="breaks")
    clinic = models.ForeignKey("clinics.Clinic", on_delete=models.CASCADE)
    weekday = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MaxValueValidator(6)])
    date = models.DateField(null=True, blank=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    reason = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(condition=models.Q(start_time__lt=models.F("end_time")), name="valid_break_interval"),
            models.CheckConstraint(condition=models.Q(weekday__isnull=True, date__isnull=False) | models.Q(weekday__isnull=False, weekday__lte=6, date__isnull=True), name="break_date_xor_weekday"),
        ]


class BlockedTime(models.Model):
    doctor = models.ForeignKey("doctors.DoctorProfile", on_delete=models.CASCADE, related_name="blocked_times")
    clinic = models.ForeignKey("clinics.Clinic", on_delete=models.CASCADE)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    reason = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["start_datetime"]
        constraints = [models.CheckConstraint(condition=models.Q(start_datetime__lt=models.F("end_datetime")), name="valid_blocked_interval")]
