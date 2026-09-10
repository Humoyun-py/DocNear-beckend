import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureTokenStore {
  SecureTokenStore([FlutterSecureStorage? storage])
    : _storage =
          storage ?? const FlutterSecureStorage(aOptions: AndroidOptions());
  final FlutterSecureStorage _storage;
  static const _access = 'docnear_access_token';
  static const _refresh = 'docnear_refresh_token';
  Future<String?> readAccess() => _storage.read(key: _access);
  Future<String?> readRefresh() => _storage.read(key: _refresh);
  Future<void> save({required String access, required String refresh}) async {
    await _storage.write(key: _access, value: access);
    await _storage.write(key: _refresh, value: refresh);
  }

  Future<void> clear() async {
    await _storage.delete(key: _access);
    await _storage.delete(key: _refresh);
  }
}
