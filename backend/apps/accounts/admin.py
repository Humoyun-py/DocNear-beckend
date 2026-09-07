from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["id", "first_name", "last_name", "role", "is_active", "is_verified"]
    list_filter = ["role", "is_active", "is_verified"]
    ordering = ["id"]
    search_fields = ["first_name", "last_name", "email", "phone_number"]
    fieldsets = ((None, {"fields": ("phone_number", "email", "password")}),
                 ("Profile", {"fields": ("first_name", "last_name", "profile_image")}),
                 ("Access", {"fields": ("role", "is_active", "is_verified", "is_staff", "is_superuser", "groups", "user_permissions")}))
    add_fieldsets = ((None, {"fields": ("phone_number", "email", "first_name", "password1", "password2", "role")}),)

    def has_module_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return False
