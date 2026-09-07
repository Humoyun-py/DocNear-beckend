from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        exclude = ["deduplication_key"]
        read_only_fields = ["user", "type", "title", "message", "is_read", "related_object_type", "related_object_id", "created_at"]


class SendNotificationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    message = serializers.CharField(max_length=2000)
    user_id = serializers.IntegerField(required=False, min_value=1)
    role = serializers.ChoiceField(choices=["patient", "doctor", "clinic_owner"], required=False)
    clinic_id = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        if sum(k in attrs for k in ["user_id", "role", "clinic_id"]) > 1:
            raise serializers.ValidationError("Choose one recipient filter.")
        return attrs
