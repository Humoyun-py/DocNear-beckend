"""Runtime route inventory and the independently specified QA permission contract."""
from rest_framework.schemas.generators import EndpointEnumerator

ROLES = ("anonymous", "patient", "doctor", "clinic_owner", "admin", "super_admin")


def endpoints():
    return sorted((path, method) for path, method, _ in EndpointEnumerator().get_api_endpoints()
                  if path.startswith("/api/") and "{format}" not in path)


def module(path):
    path = path.replace("/api/v1/", "/api/", 1)
    if path.startswith("/api/auth/"):
        return "Auth"
    if path.startswith("/api/doctor-panel/"):
        return "Doctor Panel"
    if path.startswith("/api/admin-panel/"):
        return "Admin Panel"
    if path.startswith("/api/clinic-owner/"):
        return "Clinic Owner Panel"
    if path.startswith("/api/telegram/"):
        return "Telegram"
    if "availability" in path:
        return "Availability"
    return {"clinics": "Clinics", "doctors": "Doctors", "appointments": "Appointments", "favorites": "Favorites",
            "reviews": "Reviews", "notifications": "Notifications", "search": "Patient", "profile": "Patient",
            "specialties": "Patient", "services": "Patient", "docs": "Documentation", "schema": "Documentation"}.get(path.split("/")[2], "Patient")


def allowed_roles(path, method):
    """Expected access by product role, not copied from view permission classes.

    None means server-to-server bot credentials are required. Super admins operate on
    every clinic/patient/doctor through admin routes; personal routes remain scoped.
    """
    path = path.replace("/api/v1/", "/api/", 1)
    authenticated = set(ROLES) - {"anonymous"}
    if path.startswith("/api/telegram/appointments/") or path in {
        "/api/telegram/link/",
        "/api/telegram/phone-link/",
        "/api/telegram/request-otp/",
        "/api/telegram/handoff/claim/",
        "/api/telegram/handoff/complete/",
    }:
        return None
    if path == "/api/telegram/link-code/":
        return {"patient"}
    if path.startswith("/api/admin-panel/"):
        return {"super_admin"} if path.split("/")[3] in {"settings", "logs", "admin-users"} else {"admin", "super_admin"}
    if path.startswith("/api/doctor-panel/"):
        return {"doctor"}
    if path.startswith("/api/clinic-owner/"):
        return {"clinic_owner"}
    if path.startswith("/api/waitlists/") or path.startswith("/api/appointments/") or path.startswith("/api/favorites/") or (path == "/api/reviews/" and method == "POST"):
        return {"patient"}
    if path.startswith("/api/notifications/") or path in {"/api/profile/", "/api/auth/me/", "/api/auth/logout/", "/api/auth/change-password/"}:
        return authenticated
    return set(ROLES)
