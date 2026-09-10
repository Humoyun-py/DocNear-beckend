import 'package:docnear_mobile/core/network/api_client.dart';
import 'package:docnear_mobile/core/network/api_exception.dart';
import 'package:docnear_mobile/core/storage/secure_token_store.dart';
import 'package:docnear_mobile/features/appointments/data/appointment_repository.dart';
import 'package:docnear_mobile/features/auth/data/auth_repository.dart';
import 'package:docnear_mobile/features/catalog/data/catalog_repositories.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';

class MemoryTokenStore extends SecureTokenStore {
  String? access;
  String? refresh;

  @override
  Future<String?> readAccess() async => access;
  @override
  Future<String?> readRefresh() async => refresh;
  @override
  Future<void> save({required String access, required String refresh}) async {
    this.access = access;
    this.refresh = refresh;
  }

  @override
  Future<void> clear() async {
    access = null;
    refresh = null;
  }
}

void main() {
  const live = bool.fromEnvironment('LIVE_API');
  const password = String.fromEnvironment('QA_PASSWORD');

  test(
    'real Django booking flow and double-booking protection',
    () async {
      expect(password, isNotEmpty, reason: 'Set QA_PASSWORD as a dart define.');

      ApiClient clientFor(MemoryTokenStore tokens) => ApiClient(tokens);

      final patientTokens = MemoryTokenStore();
      final patientClient = clientFor(patientTokens);
      final auth = AuthRepository(patientClient, patientTokens);
      await auth.login('qa.patient@docnear.example', password);

      final clinics = await ClinicRepository(patientClient).getClinics();
      final doctors = await DoctorRepository(patientClient).getDoctors();
      expect(clinics, isNotEmpty);
      expect(doctors, isNotEmpty);

      final doctor = doctors.firstWhere(
        (item) => item.primaryClinicId != null && item.acceptsBookings,
      );
      final clinicId = doctor.primaryClinicId!;
      final doctorRepository = DoctorRepository(patientClient);
      String? selectedDate;
      String? selectedTime;
      for (var offset = 0; offset < 30 && selectedTime == null; offset++) {
        final date = DateTime.now().add(Duration(days: offset));
        final dateValue = DateFormat('yyyy-MM-dd').format(date);
        final availability = await doctorRepository.getAvailability(
          doctor.id,
          clinicId,
          dateValue,
        );
        final open = availability.slots.where((slot) => slot.available);
        if (open.isNotEmpty) {
          selectedDate = dateValue;
          selectedTime = open.first.time;
        }
      }
      expect(selectedDate, isNotNull);
      expect(selectedTime, isNotNull);

      final appointments = AppointmentRepository(patientClient);
      final created = await appointments.create(
        doctorId: doctor.id,
        clinicId: clinicId,
        date: selectedDate!,
        time: selectedTime!,
        note: 'Flutter live integration test',
      );
      expect(created.bookingId, isNotEmpty);
      final mine = await appointments.getMine();
      expect(mine.any((item) => item.bookingId == created.bookingId), isTrue);

      final secondTokens = MemoryTokenStore();
      final secondClient = clientFor(secondTokens);
      await AuthRepository(
        secondClient,
        secondTokens,
      ).login('qa.patient-b@docnear.example', password);
      await expectLater(
        AppointmentRepository(secondClient).create(
          doctorId: doctor.id,
          clinicId: clinicId,
          date: selectedDate,
          time: selectedTime,
        ),
        throwsA(
          isA<ApiException>().having(
            (error) => error.isSlotUnavailable,
            'isSlotUnavailable',
            isTrue,
          ),
        ),
      );

      await appointments.cancel(created.id, 'Integration test cleanup');
    },
    skip: live ? false : 'Set LIVE_API=true for the isolated Django QA run.',
    timeout: const Timeout(Duration(minutes: 2)),
  );
}
