from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.accounts.views import MeView
from apps.clinics.views import ClinicViewSet, ServiceViewSet
from apps.doctors.views import DoctorViewSet, SpecialtyViewSet, SearchView
from apps.appointments.views import PatientAppointmentViewSet
from apps.appointments.waitlist import WaitlistViewSet
from apps.favorites.views import FavoriteDoctorView, FavoriteClinicView, FavoriteDoctorMutationView, FavoriteClinicMutationView
from apps.reviews.views import ReviewViewSet
from apps.notifications.views import NotificationViewSet


def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"success": True, "data": {"status": "ok"}})
    except Exception:
        return JsonResponse({"success": False, "code": "unavailable", "message": "Service unavailable."}, status=503)


def server_error(request):
    return JsonResponse({"success": False, "code": "server_error", "message": "An unexpected error occurred.", "errors": {}}, status=500)


def not_found(request, exception):
    return JsonResponse({"success": False, "code": "not_found", "message": "Not found.", "errors": {}}, status=404)


handler500 = server_error
handler404 = not_found
router = DefaultRouter()
router.register("waitlists", WaitlistViewSet, basename="waitlists")
for prefix, view in [("clinics", ClinicViewSet), ("doctors", DoctorViewSet), ("services", ServiceViewSet),
    ("specialties", SpecialtyViewSet), ("appointments", PatientAppointmentViewSet), ("reviews", ReviewViewSet), ("notifications", NotificationViewSet)]:
    router.register(prefix, view, basename=prefix)

urlpatterns = [path("admin/", admin.site.urls), path("health/", health),
    path("api/auth/", include("apps.accounts.urls")), path("api/profile/", MeView.as_view()),
    path("api/search/", SearchView.as_view()),
    path("api/favorites/doctors/", FavoriteDoctorView.as_view()),
    path("api/favorites/doctors/<int:pk>/", FavoriteDoctorMutationView.as_view()),
    path("api/favorites/clinics/", FavoriteClinicView.as_view()),
    path("api/favorites/clinics/<int:pk>/", FavoriteClinicMutationView.as_view()),
    path("api/doctor-panel/", include("apps.doctor_panel.urls")), path("api/admin-panel/", include("apps.admin_panel.urls")),
    path("api/clinic-owner/", include("apps.clinic_owner_panel.urls")), path("api/telegram/", include("apps.telegram_support.urls")),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"), path("api/", include(router.urls)),
    # Versioned compatibility surface used by web, doctor panel, and Android clients.
    path("api/v1/auth/", include("apps.accounts.urls")), path("api/v1/profile/", MeView.as_view()),
    path("api/v1/search/", SearchView.as_view()),
    path("api/v1/favorites/doctors/", FavoriteDoctorView.as_view()),
    path("api/v1/favorites/doctors/<int:pk>/", FavoriteDoctorMutationView.as_view()),
    path("api/v1/favorites/clinics/", FavoriteClinicView.as_view()),
    path("api/v1/favorites/clinics/<int:pk>/", FavoriteClinicMutationView.as_view()),
    path("api/v1/doctor-panel/", include("apps.doctor_panel.urls")), path("api/v1/admin-panel/", include("apps.admin_panel.urls")),
    path("api/v1/clinic-owner/", include("apps.clinic_owner_panel.urls")), path("api/v1/telegram/", include("apps.telegram_support.urls")),
    path("api/v1/", include(router.urls))]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
