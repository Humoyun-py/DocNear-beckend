from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("doctors", views.OwnerDoctorViewSet, basename="owner-doctors")
router.register("appointments", views.OwnerAppointmentViewSet, basename="owner-appointments")
urlpatterns = [path("dashboard/", views.OwnerDashboard.as_view()), path("analytics/", views.OwnerDashboard.as_view()),
    path("clinic/", views.OwnerClinicView.as_view()), path("clinics/", views.OwnerClinicList.as_view()),
    path("services/", views.OwnerServicesView.as_view()), path("schedule/", views.OwnerScheduleView.as_view()), path("", include(router.urls))]
