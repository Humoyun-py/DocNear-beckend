import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../shared/models/models.dart';

class FavoriteRepository {
  FavoriteRepository(this.api);
  final ApiClient api;
  Future<List<DoctorModel>> doctors() async => (await api.getList(
    ApiEndpoints.favoriteDoctors,
  )).map((e) => DoctorModel.fromJson(asJson(e))).toList();
  Future<List<ClinicModel>> clinics() async => (await api.getList(
    ApiEndpoints.favoriteClinics,
  )).map((e) => ClinicModel.fromJson(asJson(e))).toList();
  Future<void> setDoctor(int id, bool favorite) async {
    if (favorite) {
      await api.post('${ApiEndpoints.favoriteDoctors}$id/');
    } else {
      await api.delete('${ApiEndpoints.favoriteDoctors}$id/');
    }
  }

  Future<void> setClinic(int id, bool favorite) async {
    if (favorite) {
      await api.post('${ApiEndpoints.favoriteClinics}$id/');
    } else {
      await api.delete('${ApiEndpoints.favoriteClinics}$id/');
    }
  }
}

class NotificationRepository {
  NotificationRepository(this.api);
  final ApiClient api;
  Future<List<NotificationModel>> list() async => (await api.getList(
    ApiEndpoints.notifications,
  )).map((e) => NotificationModel.fromJson(asJson(e))).toList();
  Future<void> markRead(int id) async {
    await api.post('${ApiEndpoints.notifications}$id/read/');
  }

  Future<void> markAllRead() async {
    await api.post('${ApiEndpoints.notifications}read-all/');
  }
}
