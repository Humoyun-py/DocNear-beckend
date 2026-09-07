from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("appointments", views.DoctorAppointmentViewSet, basename="doctor-appointments")
router.register("patients", views.DoctorPatientViewSet, basename="doctor-patients")
router.register("breaks", views.DoctorBreakViewSet, basename="doctor-breaks")
router.register("blocked-times", views.DoctorBlockedTimeViewSet, basename="doctor-blocks")
urlpatterns = [path("dashboard/", views.DoctorDashboard.as_view()), path("analytics/", views.DoctorAnalytics.as_view()),
    path("schedule/", views.DoctorScheduleView.as_view()), path("availability/toggle/", views.DoctorAvailabilityToggle.as_view()),
    path("profile/", views.DoctorProfileView.as_view()), path("profile/preview/", views.DoctorPreviewView.as_view()),
    path("clinics/", views.DoctorClinicsView.as_view()), path("", include(router.urls))]
