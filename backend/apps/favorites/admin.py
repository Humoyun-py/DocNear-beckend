from django.contrib import admin
from common.admin import ReadOnlyAdmin
from .models import FavoriteDoctor, FavoriteClinic

admin.site.register(FavoriteDoctor, ReadOnlyAdmin)
admin.site.register(FavoriteClinic, ReadOnlyAdmin)
