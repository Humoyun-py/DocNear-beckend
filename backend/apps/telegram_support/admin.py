from django.contrib import admin
from common.admin import ReadOnlyAdmin
from .models import TelegramLink

admin.site.register(TelegramLink, ReadOnlyAdmin)
