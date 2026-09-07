from django.contrib import admin
from common.admin import ReadOnlyAdmin
from .models import Appointment, AppointmentEvent


@admin.register(Appointment)
class AppointmentAdmin(ReadOnlyAdmin):
    list_display = ["booking_id", "doctor", "clinic", "appointment_date", "start_time", "status"]
    list_filter = ["status", "appointment_date", "clinic"]
    search_fields = ["booking_id"]


admin.site.register(AppointmentEvent, ReadOnlyAdmin)
