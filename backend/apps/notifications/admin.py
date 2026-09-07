from django.contrib import admin
from common.admin import ReadOnlyAdmin
from .models import Notification

admin.site.register(Notification, ReadOnlyAdmin)
