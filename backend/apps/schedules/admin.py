from django.contrib import admin
from common.admin import ReadOnlyAdmin
from .models import DoctorSchedule, DoctorBreak, BlockedTime

admin.site.register(DoctorSchedule, ReadOnlyAdmin)
admin.site.register(DoctorBreak, ReadOnlyAdmin)
admin.site.register(BlockedTime, ReadOnlyAdmin)
