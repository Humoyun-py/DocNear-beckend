import 'package:dio/dio.dart';
import 'package:docnear_mobile/core/network/api_client.dart';
import 'package:docnear_mobile/core/storage/secure_token_store.dart';
import 'package:docnear_mobile/features/catalog/data/catalog_repositories.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockSecureStorage extends Mock implements FlutterSecureStorage {}

class MockDio extends Mock implements Dio {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: '/'));
  });

  test(
    'secure token store writes, reads, and clears both JWT values',
    () async {
      final storage = MockSecureStorage();
      when(
        () => storage.write(
          key: any(named: 'key'),
          value: any(named: 'value'),
        ),
      ).thenAnswer((_) async {});
      when(
        () => storage.read(key: 'docnear_access_token'),
      ).thenAnswer((_) async => 'access-token');
      when(
        () => storage.read(key: 'docnear_refresh_token'),
      ).thenAnswer((_) async => 'refresh-token');
      when(
        () => storage.delete(key: any(named: 'key')),
      ).thenAnswer((_) async {});

      final store = SecureTokenStore(storage);
      await store.save(access: 'access-token', refresh: 'refresh-token');
      expect(await store.readAccess(), 'access-token');
      expect(await store.readRefresh(), 'refresh-token');
      await store.clear();

      verify(
        () => storage.write(key: 'docnear_access_token', value: 'access-token'),
      ).called(1);
      verify(
        () =>
            storage.write(key: 'docnear_refresh_token', value: 'refresh-token'),
      ).called(1);
      verify(() => storage.delete(key: 'docnear_access_token')).called(1);
      verify(() => storage.delete(key: 'docnear_refresh_token')).called(1);
    },
  );

  test('clinic repository unwraps paginated data through mocked Dio', () async {
    final dio = MockDio();
    final storage = MockSecureStorage();
    when(() => dio.interceptors).thenReturn(Interceptors());
    when(
      () => dio.options,
    ).thenReturn(BaseOptions(baseUrl: 'https://example.test/'));
    when(
      () => dio.get<dynamic>(
        any(),
        queryParameters: any(named: 'queryParameters'),
      ),
    ).thenAnswer(
      (_) async => Response<dynamic>(
        requestOptions: RequestOptions(path: 'clinics/'),
        statusCode: 200,
        data: {
          'success': true,
          'data': {
            'count': 1,
            'next': null,
            'previous': null,
            'results': [
              {
                'id': 3,
                'name': 'DocNear Clinic',
                'address': 'Tashkent',
                'latitude': 41.3111,
                'longitude': 69.2797,
                'is_verified': true,
                'is_partner': true,
                'is_active': true,
                'services': <dynamic>[],
              },
            ],
          },
        },
      ),
    );

    final repository = ClinicRepository(
      ApiClient(SecureTokenStore(storage), dio: dio),
    );
    final clinics = await repository.getClinics();
    expect(clinics, hasLength(1));
    expect(clinics.single.name, 'DocNear Clinic');
    expect(clinics.single.verifiedPartner, isTrue);
  });
}
