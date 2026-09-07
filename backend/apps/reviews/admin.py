from django.contrib import admin
from common.admin import ReadOnlyAdmin
from .models import Review

admin.site.register(Review, ReadOnlyAdmin)
