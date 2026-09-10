abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8001/api/v1/',
  );
  static const googleMapsApiKey = String.fromEnvironment('GOOGLE_MAPS_API_KEY');
  static const discoveryRadiusKm = 5.0;
}
