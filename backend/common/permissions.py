from rest_framework.permissions import BasePermission


def is_admin(user):
    return user.is_authenticated and user.is_active and user.role in {"admin", "super_admin"}


class RolePermission(BasePermission):
    roles = ()

    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.is_active and request.user.role in self.roles)


class IsPatient(RolePermission):
    roles = ("patient",)


class IsDoctor(RolePermission):
    roles = ("doctor",)


class IsClinicOwner(RolePermission):
    roles = ("clinic_owner",)


class IsAdmin(RolePermission):
    roles = ("admin", "super_admin")


class IsSuperAdmin(RolePermission):
    roles = ("super_admin",)
