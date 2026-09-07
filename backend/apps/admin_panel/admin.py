from django.contrib import admin
from common.admin import ReadOnlyAdmin
from .models import PlatformSettings, AuditLog

admin.site.register(PlatformSettings, ReadOnlyAdmin)
admin.site.register(AuditLog, ReadOnlyAdmin)
