import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/secure_token_store.dart';
import '../../../shared/models/models.dart';

class AuthRepository {
  AuthRepository(this.api, this.tokens);
  final ApiClient api;
  final SecureTokenStore tokens;
  Future<void> requestOtp({
    required String phoneNumber,
    required String purpose,
    required String channel,
    String? firstName,
    String? lastName,
  }) async {
    final data = <String, dynamic>{
      'phone_number': phoneNumber,
      'purpose': purpose,
      'channel': channel,
    };
    if (firstName != null) data['first_name'] = firstName;
    if (lastName != null) data['last_name'] = lastName;
    await api.post(ApiEndpoints.requestOtp, data: data, anonymous: true);
  }

  Future<Uri> createTelegramHandoff({
    required String phoneNumber,
    required String purpose,
    String? firstName,
    String? lastName,
  }) async {
    final data = await api.post(
      ApiEndpoints.telegramHandoff,
      data: {
        'phone_number': phoneNumber,
        'purpose': purpose,
        'first_name': firstName?.trim(),
        'last_name': lastName?.trim(),
      },
      anonymous: true,
    );
    final botUrl = Uri.tryParse(asString(data['bot_url']));
    if (botUrl == null || botUrl.scheme != 'https' || botUrl.host != 't.me') {
      throw const FormatException('Telegram bot manzili yaroqsiz.');
    }
    return botUrl;
  }

  Future<UserModel> verifyOtp({
    required String phoneNumber,
    required String code,
    required String purpose,
  }) async {
    final data = await api.post(
      ApiEndpoints.verifyOtp,
      data: {'phone_number': phoneNumber, 'code': code, 'purpose': purpose},
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
