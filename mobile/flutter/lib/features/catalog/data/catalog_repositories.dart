import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../shared/models/models.dart';

class ClinicRepository {
  ClinicRepository(this.api);
  final ApiClient api;
  Future<List<ClinicModel>> getClinics() async => (await api.getList(
    ApiEndpoints.clinics,
  )).map((e) => ClinicModel.fromJson(asJson(e))).toList();
  Future<List<ClinicModel>> getNearby(
    double latitude,
    double longitude, {
    bool emergency = false,
  }) async => (await api.getList(
    '${ApiEndpoints.clinics}${emergency ? 'emergency/' : 'nearby/'}',
    query: {'latitude': latitude, 'longitude': longitude, 'radius': 5},
  )).map((e) => ClinicModel.fromJson(asJson(e))).toList();
  Future<List<ClinicModel>> getNearbyClinics(
    double latitude,
    double longitude,
  ) => getNearby(latitude, longitude);
  Future<List<ClinicModel>> getEmergencyClinics(
    double latitude,
    double longitude,
  ) => getNearby(latitude, longitude, emergency: true);
  Future<ClinicModel> getDetails(int id) async =>
      ClinicModel.fromJson(await api.getObject('${ApiEndpoints.clinics}$id/'));
  Future<ClinicModel> getClinicDetails(int id) => getDetails(id);
}

class DoctorRepository {
  DoctorRepository(this.api);
  final ApiClient api;
  Future<List<DoctorModel>> getDoctors({
    int? clinicId,
    int? specialtyId,
  }) async => (await api.getList(
    ApiEndpoints.doctors,
    query: {
      if (clinicId != null) 'clinic': clinicId,
      if (specialtyId != null) 'specialty': specialtyId,
    },
  )).map((e) => DoctorModel.fromJson(asJson(e))).toList();
  Future<List<DoctorModel>> getNearby(
    double latitude,
    double longitude,
  ) async => (await api.getList(
    '${ApiEndpoints.doctors}nearby/',
    query: {'latitude': latitude, 'longitude': longitude, 'radius': 5},
  )).map((e) => DoctorModel.fromJson(asJson(e))).toList();
  Future<DoctorModel> getDetails(int id) async =>
      DoctorModel.fromJson(await api.getObject('${ApiEndpoints.doctors}$id/'));
  Future<DoctorModel> getDoctorDetails(int id) => getDetails(id);
  Future<AvailabilityResponseModel> getAvailability(
    int doctorId,
    int clinicId,
    String date,
  ) async => AvailabilityResponseModel.fromJson(
    await api.getObject(
      '${ApiEndpoints.doctors}$doctorId/availability/',
      query: {'clinic_id': clinicId, 'date': date},
    ),
  );
  Future<AvailabilityResponseModel> getDoctorAvailability(
    int doctorId,
    int clinicId,
    String date,
  ) => getAvailability(doctorId, clinicId, date);
  Future<List<SpecialtyModel>> getSpecialties() async => (await api.getList(
    ApiEndpoints.specialties,
  )).map((e) => SpecialtyModel.fromJson(asJson(e))).toList();
}

class EmergencyRepository {
  EmergencyRepository(this.api);
  final ApiClient api;
  Future<List<ClinicModel>> getEmergencyClinics(
    double latitude,
    double longitude,
  ) async => (await api.getList(
    '${ApiEndpoints.clinics}emergency/',
    query: {'latitude': latitude, 'longitude': longitude, 'radius': 5},
  )).map((item) => ClinicModel.fromJson(asJson(item))).toList();
}

class SearchRepository {
  SearchRepository(this.api);
  final ApiClient api;
  Future<SearchResultModel> search(String query) async =>
      SearchResultModel.fromJson(
        await api.getObject(ApiEndpoints.search, query: {'q': query}),
      );
}
