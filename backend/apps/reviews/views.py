from django.db.models import Q
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from common.permissions import IsPatient
from .models import Review
from .serializers import ReviewSerializer
from .services import create_review


class ReviewViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ReviewSerializer
    filterset_fields = ["doctor", "clinic"]

    def get_permissions(self):
        return [IsPatient()] if self.action == "create" else [AllowAny()]

    def get_queryset(self):
        public = Q(is_visible=True, clinic__is_active=True, clinic__is_partner=True, clinic__is_verified=True, doctor__is_active=True, doctor__is_verified=True)
        if self.request.user.is_authenticated and self.request.user.role == "patient":
            public |= Q(patient=self.request.user)
        return Review.objects.filter(public)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = create_review(request.user, serializer.validated_data)
        return Response(self.get_serializer(review).data, status=201)
