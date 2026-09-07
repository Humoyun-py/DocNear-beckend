from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from common.permissions import IsPatient
from apps.doctors.models import DoctorProfile
from apps.doctors.serializers import DoctorSerializer
from apps.clinics.models import Clinic
from apps.clinics.serializers import ClinicSerializer
from .models import FavoriteDoctor, FavoriteClinic


class FavoriteDoctorView(generics.ListAPIView):
    permission_classes = [IsPatient]
    http_method_names = ["get", "head", "options"]
    serializer_class = DoctorSerializer
    target_model = DoctorProfile
    favorite_model = FavoriteDoctor
    target_field = "doctor"

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return self.target_model.objects.none()
        return self.target_model.objects.public().filter(pk__in=self.favorite_model.objects.filter(patient=self.request.user).values(f"{self.target_field}_id"))

    def post(self, request, pk):
        target = get_object_or_404(self.target_model.objects.public(), pk=pk)
        _, created = self.favorite_model.objects.get_or_create(patient=request.user, **{self.target_field: target})
        return Response({"is_favorite": True}, status=201 if created else 200)

    def delete(self, request, pk):
        self.favorite_model.objects.filter(patient=request.user, **{f"{self.target_field}_id": pk}).delete()
        return Response(status=204)


class FavoriteClinicView(FavoriteDoctorView):
    serializer_class = ClinicSerializer
    target_model = Clinic
    favorite_model = FavoriteClinic
    target_field = "clinic"


class FavoriteDoctorMutationView(FavoriteDoctorView):
    http_method_names = ["post", "delete", "options"]


class FavoriteClinicMutationView(FavoriteClinicView):
    http_method_names = ["post", "delete", "options"]
