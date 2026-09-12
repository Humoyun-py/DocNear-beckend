from django.contrib import admin
from common.admin import ReadOnlyAdmin
from .models import TelegramLink, TelegramPhoneLink

admin.site.register(TelegramLink, ReadOnlyAdmin)
admin.site.register(TelegramPhoneLink, ReadOnlyAdmin)
