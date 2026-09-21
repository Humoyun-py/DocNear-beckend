import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../shared/models/models.dart';

class AppointmentRepository {
  AppointmentRepository(this.api);
  final ApiClient api;
  Future<List<AppointmentModel>> getMine() async => (await api.getList(
    '${ApiEndpoints.appointments}my/',
  )).map((e) => AppointmentModel.fromJson(asJson(e))).toList();
  Future<List<AppointmentModel>> getMyAppointments() => getMine();
  Future<AppointmentModel> getDetails(int id) async =>
      AppointmentModel.fromJson(
        await api.getObject('${ApiEndpoints.appointments}$id/'),
      );
  Future<AppointmentModel> getAppointmentDetails(int id) => getDetails(id);
  Future<AppointmentModel> create({
    required int doctorId,
    required int clinicId,
    required String date,
    required String time,
    String note = '',
  }) async => AppointmentModel.fromJson(
    await api.post(
      ApiEndpoints.appointments,
      data: bookingBody(
        doctorId: doctorId,
        clinicId: clinicId,
        date: date,
        time: time,
        note: note,
      ),
    ),
  );
  Future<AppointmentModel> createAppointment({
    required int doctorId,
    required int clinicId,
    required String date,
    required String time,
    String note = '',
  }) => create(
    doctorId: doctorId,
    clinicId: clinicId,
    date: date,
    time: time,
    note: note,
  );
  Future<AppointmentModel> cancel(int id, String reason) async =>
      AppointmentModel.fromJson(
        await api.post(
          '${ApiEndpoints.appointments}$id/cancel/',
          data: {'reason': reason},
        ),
      );
  Future<AppointmentModel> reschedule(int id, String date, String time) async =>
      AppointmentModel.fromJson(
        await api.post(
          '${ApiEndpoints.appointments}$id/reschedule/',
          data: {'date': date, 'time': time},
        ),
      );
  static Map<String, dynamic> bookingBody({
    required int doctorId,
    required int clinicId,
    required String date,
    required String time,
    String note = '',
  }) => {
    'doctor_id': doctorId,
    'clinic_id': clinicId,
    'date': date,
    'time': time,
    'patient_note': note,
  };
}

class BookingRepository {
  BookingRepository(this.appointments);
  final AppointmentRepository appointments;
  Future<AppointmentModel> createAppointment({
    required int doctorId,
    required int clinicId,
    required String date,
    required String time,
    String note = '',
  }) => appointments.createAppointment(
    doctorId: doctorId,
    clinicId: clinicId,
    date: date,
    time: time,
    note: note,
  );
}
