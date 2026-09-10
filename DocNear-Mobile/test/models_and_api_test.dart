import 'package:docnear_mobile/core/network/api_client.dart';
import 'package:docnear_mobile/core/network/api_exception.dart';
import 'package:docnear_mobile/features/appointments/data/appointment_repository.dart';
import 'package:docnear_mobile/shared/models/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('response envelope', () {
    test('unwraps a single object', () {
      expect(
        ApiClient.unwrapObject({
          'success': true,
          'data': {'id': 7},
        }),
        {'id': 7},
      );
    });

    test('unwraps paginated results', () {
      expect(
        ApiClient.unwrapList({
          'success': true,
          'data': {
            'count': 1,
            'results': [
              {'id': 7},
            ],
          },
        }),
        [
          {'id': 7},
        ],
      );
    });

    test('preserves backend slot error code', () {
      expect(
        () => ApiClient.unwrapObject({
          'success': false,
          'code': 'slot_unavailable',
          'message': 'This appointment time is no longer available.',
          'errors': <String, dynamic>{},
        }),
        throwsA(
          isA<ApiException>().having(
            (error) => error.isSlotUnavailable,
            'isSlotUnavailable',
            isTrue,
          ),
        ),
      );
    });
  });

  test('booking request never sends a patient id', () {
    final body = AppointmentRepository.bookingBody(
      doctorId: 1,
      clinicId: 2,
      date: '2026-09-09',
      time: '09:00',
      note: 'Checkup',
    );
    expect(body, {
      'doctor_id': 1,
      'clinic_id': 2,
      'date': '2026-09-09',
      'time': '09:00',
      'patient_note': 'Checkup',
    });
    expect(body.containsKey('patient_id'), isFalse);
  });

  test('appointment model parses backend serializer fields', () {
    final appointment = AppointmentModel.fromJson({
      'id': 4,
      'booking_id': 'DN-2026-0004',
      'doctor': 1,
      'doctor_name': 'Dr Test',
      'clinic': 2,
      'clinic_name': 'DocNear Clinic',
      'specialty_name': 'Cardiology',
      'appointment_date': '2026-09-09',
      'start_time': '09:00:00',
      'end_time': '09:30:00',
      'patient_note': '',
      'status': 'pending',
      'cancel_reason': '',
    });
    expect(appointment.bookingId, 'DN-2026-0004');
    expect(appointment.isUpcoming, isTrue);
  });

  test('availability parses only backend supplied slots', () {
    final availability = AvailabilityResponseModel.fromJson({
      'date': '2026-09-09',
      'doctor': {'id': 1, 'name': 'Dr Test', 'affiliations': <dynamic>[]},
      'clinic': {'id': 2, 'name': 'DocNear Clinic'},
      'slots': [
        {'time': '09:00', 'end_time': '09:30', 'available': true},
        {'time': '09:30', 'end_time': '10:00', 'available': false},
      ],
    });
    expect(availability.slots, hasLength(2));
    expect(availability.slots.first.available, isTrue);
    expect(availability.slots.last.available, isFalse);
  });
}
