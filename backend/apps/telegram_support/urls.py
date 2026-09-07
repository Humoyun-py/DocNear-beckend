from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.clinics.views import ClinicViewSet
from apps.doctors.views import DoctorViewSet, SearchView
from .views import TelegramAppointmentViewSet, CreateLinkCodeView, RedeemLinkView

router = DefaultRouter()
router.register("appointments", TelegramAppointmentViewSet, basename="telegram-appointments")
urlpatterns = [path("link-code/", CreateLinkCodeView.as_view()), path("link/", RedeemLinkView.as_view()),
    path("clinics/nearby/", ClinicViewSet.as_view({"get": "nearby"})), path("search/", SearchView.as_view()),
    path("doctors/<int:pk>/availability/", DoctorViewSet.as_view({"get": "availability"})),
    path("appointments/by-booking-id/<str:booking_id>/", TelegramAppointmentViewSet.as_view({"get": "by_booking_id"})),
    path("", include(router.urls))]
