import 'package:flutter/foundation.dart';

abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8001/api/v1/',
  );
  static const googleMapsEnabled = bool.fromEnvironment('GOOGLE_MAPS_ENABLED');
  static const discoveryRadiusKm = 5.0;

  static String validateApiUrl(String value, {bool release = kReleaseMode}) {
    final uri = Uri.tryParse(value);
    if (uri == null ||
        uri.host.isEmpty ||
        uri.userInfo.isNotEmpty ||
        !['http', 'https'].contains(uri.scheme) ||
        (release && uri.scheme != 'https')) {
      throw StateError(
        'API_BASE_URL must be an absolute URL; release requires HTTPS.',
      );
    }
    return value.endsWith('/') ? value : '$value/';
  }
}
