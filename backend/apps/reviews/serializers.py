from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "doctor", "clinic", "appointment", "rating", "comment", "is_visible", "created_at"]
        read_only_fields = ["doctor", "clinic", "is_visible", "created_at"]
        extra_kwargs = {"appointment": {"write_only": True, "validators": []}}
