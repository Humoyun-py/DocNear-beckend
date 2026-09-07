from rest_framework import serializers
from apps.doctors.models import DoctorClinic
from .models import DoctorSchedule, DoctorBreak, BlockedTime


class IntervalValidation:
    def validate(self, attrs):
        attrs = super().validate(attrs)
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start and end and (start >= end or start.tzinfo or end.tzinfo):
            raise serializers.ValidationError("End time must follow start time within the same day.")
        return attrs


class ScheduleSerializer(IntervalValidation, serializers.ModelSerializer):
    class Meta:
        model = DoctorSchedule
        fields = ["id", "doctor", "clinic", "day_of_week", "start_time", "end_time", "is_working"]
        read_only_fields = ["doctor"]
        validators = []


class BreakSerializer(IntervalValidation, serializers.ModelSerializer):
    class Meta:
        model = DoctorBreak
        fields = "__all__"
        read_only_fields = ["doctor"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if (attrs.get("weekday") is None) == (attrs.get("date") is None):
            raise serializers.ValidationError("Specify either weekday or date, exclusively.")
        return attrs


class BlockedTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedTime
        fields = "__all__"
        read_only_fields = ["doctor"]

    def validate(self, attrs):
        if attrs["start_datetime"] >= attrs["end_datetime"]:
            raise serializers.ValidationError("End must follow start.")
        return attrs


class BookingPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorClinic
        fields = ["clinic", "consultation_duration", "buffer_time", "max_appointments_per_day"]
        read_only_fields = ["clinic"]


class BookingPolicyInputSerializer(BookingPolicySerializer):
    clinic = serializers.IntegerField(min_value=1)


class WeeklyScheduleSerializer(serializers.Serializer):
    schedules = ScheduleSerializer(many=True, required=False)
    policies = BookingPolicyInputSerializer(many=True, required=False)


class AvailabilityToggleSerializer(serializers.Serializer):
    available = serializers.BooleanField()
