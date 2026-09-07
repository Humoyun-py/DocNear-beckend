from rest_framework import serializers
from .models import Appointment, AppointmentEvent


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.user.get_full_name", read_only=True)
    clinic_name = serializers.CharField(source="clinic.name", read_only=True)
    specialty_name = serializers.CharField(source="specialty.name", read_only=True)

    class Meta:
        model = Appointment
        fields = ["id", "booking_id", "patient", "patient_name", "doctor", "doctor_name", "clinic", "clinic_name", "specialty", "specialty_name", "appointment_date", "start_time", "end_time", "patient_note", "status", "cancel_reason", "created_at", "updated_at"]
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and request.user.role == "clinic_owner":
            data.pop("patient_note", None)
        return data


class BookingSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField(min_value=1)
    clinic_id = serializers.IntegerField(min_value=1)
    date = serializers.DateField()
    time = serializers.TimeField()
    patient_note = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class RescheduleSerializer(serializers.Serializer):
    date = serializers.DateField()
    time = serializers.TimeField()


class CancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500, default="")


class TransitionSerializer(CancelSerializer):
    status = serializers.ChoiceField(choices=Appointment.Status.choices)


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentEvent
        fields = ["id", "action", "from_status", "to_status", "created_at"]
