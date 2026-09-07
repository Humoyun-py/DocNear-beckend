from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import catalog, users, views

router = DefaultRouter()
for prefix, view in [("clinics", catalog.ClinicAdminViewSet), ("doctors", catalog.DoctorAdminViewSet),
    ("specialties", catalog.SpecialtyAdminViewSet), ("services", catalog.ServiceAdminViewSet),
    ("clinic-images", catalog.ClinicImageAdminViewSet), ("affiliations", catalog.AffiliationAdminViewSet),
    ("patients", users.PatientAdminViewSet), ("admin-users", users.AdminUserViewSet), ("owners", users.OwnerAccountViewSet),
    ("appointments", views.AdminAppointmentViewSet), ("reviews", views.AdminReviewViewSet),
    ("notifications", views.AdminNotificationViewSet), ("logs", views.AuditLogViewSet)]:
    router.register(prefix, view, basename="admin-" + prefix)
urlpatterns = [path("dashboard/", views.AdminDashboard.as_view()), path("analytics/", views.AdminDashboard.as_view()),
               path("settings/", views.SettingsView.as_view()), path("", include(router.urls))]
