import 'package:docnear_mobile/core/config/app_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('release API rejects cleartext and embedded credentials', () {
    for (final url in [
      'http://example.test/api/',
      'https://user:pass@example.test/api/',
      '/api/',
    ]) {
      expect(
        () => AppConfig.validateApiUrl(url, release: true),
        throwsStateError,
      );
    }
    expect(
      AppConfig.validateApiUrl('https://example.test/api', release: true),
      'https://example.test/api/',
    );
    expect(
      AppConfig.validateApiUrl('http://10.0.2.2:8001/api/', release: false),
      'http://10.0.2.2:8001/api/',
    );
  });
}
