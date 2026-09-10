import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/secure_token_store.dart';
import '../../../shared/models/models.dart';

class AuthRepository {
  AuthRepository(this.api, this.tokens);
  final ApiClient api;
  final SecureTokenStore tokens;
  Future<UserModel> login(String identifier, String password) async {
    final data = await api.post(
      ApiEndpoints.login,
      data: {'identifier': identifier, 'password': password},
      anonymous: true,
    );
    await tokens.save(
      access: asString(data['access']),
      refresh: asString(data['refresh']),
    );
    return UserModel.fromJson(asJson(data['user']));
  }

  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
  }) async {
    final data = await api.post(
      ApiEndpoints.register,
      data: {
        'first_name': firstName,
        'last_name': lastName,
        'email': email.isEmpty ? null : email,
        'phone_number': phone.isEmpty ? null : phone,
        'password': password,
      },
      anonymous: true,
    );
    await tokens.save(
      access: asString(data['access']),
      refresh: asString(data['refresh']),
    );
    return UserModel.fromJson(asJson(data['user']));
  }

  Future<UserModel> me() async =>
      UserModel.fromJson(await api.getObject(ApiEndpoints.me));
  Future<UserModel> getCurrentUser() => me();
  Future<String?> refreshToken() => api.refreshAccessToken();
  Future<UserModel> updateProfile(Map<String, dynamic> fields) async =>
      UserModel.fromJson(await api.patch(ApiEndpoints.me, data: fields));
  Future<void> logout() async {
    final refresh = await tokens.readRefresh();
    try {
      if (refresh != null)
        await api.post(ApiEndpoints.logout, data: {'refresh': refresh});
    } finally {
      await tokens.clear();
    }
  }
}

class ProfileRepository {
  ProfileRepository(this.api);
  final ApiClient api;
  Future<UserModel> getProfile() async =>
      UserModel.fromJson(await api.getObject(ApiEndpoints.me));
  Future<UserModel> updateProfile(Map<String, dynamic> fields) async =>
      UserModel.fromJson(await api.patch(ApiEndpoints.me, data: fields));
}
