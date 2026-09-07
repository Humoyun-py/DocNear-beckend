from django.contrib import admin
from django.db import transaction
from .models import Clinic, ClinicImage, ClinicService


@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    list_display = ["name", "is_verified", "is_partner", "is_active"]
    list_filter = ["is_verified", "is_partner", "is_active"]
    search_fields = ["name", "address"]
    readonly_fields = ["rating", "working_hours", "is_24_7"]

    @transaction.atomic
    def save_model(self, request, obj, form, change):
        if change:
            Clinic.objects.select_for_update().get(pk=obj.pk)
        super().save_model(request, obj, form, change)


admin.site.register(ClinicImage)
admin.site.register(ClinicService)
