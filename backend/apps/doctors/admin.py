from django.contrib import admin
from django.db import transaction
from common.admin import ReadOnlyAdmin
from .models import DoctorProfile, DoctorClinic


@admin.register(DoctorProfile)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ["user", "is_verified", "is_active", "accepts_bookings"]
    list_filter = ["is_verified", "is_active"]
    readonly_fields = ["rating", "total_reviews", "pending_profile"]

    @transaction.atomic
    def save_model(self, request, obj, form, change):
        if change:
            DoctorProfile.objects.select_for_update().get(pk=obj.pk)
        super().save_model(request, obj, form, change)


admin.site.register(DoctorClinic, ReadOnlyAdmin)
