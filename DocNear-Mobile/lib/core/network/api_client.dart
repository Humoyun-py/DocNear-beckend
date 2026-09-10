import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../storage/secure_token_store.dart';
import 'api_endpoints.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient(this.tokens, {Dio? dio})
    : dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: AppConfig.apiBaseUrl.endsWith('/')
                  ? AppConfig.apiBaseUrl
                  : '${AppConfig.apiBaseUrl}/',
              connectTimeout: const Duration(seconds: 15),
              receiveTimeout: const Duration(seconds: 20),
              sendTimeout: const Duration(seconds: 20),
              headers: const {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
            ),
          ) {
    this.dio.interceptors.add(
      InterceptorsWrapper(onRequest: _authorize, onError: _handleUnauthorized),
    );
  }
  final Dio dio;
  final SecureTokenStore tokens;
  Future<String?>? _refreshing;
  void Function()? onSessionExpired;

  Future<void> _authorize(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (options.extra['anonymous'] != true) {
      final token = await tokens.readAccess();
      if (token != null) options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  Future<void> _handleUnauthorized(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final request = error.requestOptions;
    if (error.response?.statusCode != 401 ||
        request.extra['retried'] == true ||
        request.path.contains(ApiEndpoints.refresh)) {
      handler.next(error);
      return;
    }
    try {
      final access = await (_refreshing ??= _refresh());
      _refreshing = null;
      if (access == null)
        throw const ApiException(
          'Sessiya tugadi. Qayta kiring.',
          statusCode: 401,
        );
      request.extra['retried'] = true;
      request.headers['Authorization'] = 'Bearer $access';
      handler.resolve(await dio.fetch<dynamic>(request));
    } catch (_) {
      _refreshing = null;
      await tokens.clear();
      onSessionExpired?.call();
      handler.next(error);
    }
  }

  Future<String?> _refresh() async {
    final refresh = await tokens.readRefresh();
    if (refresh == null) return null;
    try {
      final bare = Dio(
        BaseOptions(baseUrl: dio.options.baseUrl, headers: dio.options.headers),
      );
      final response = await bare.post<dynamic>(
        ApiEndpoints.refresh,
        data: {'refresh': refresh},
      );
      final data = unwrapObject(response.data);
      final access = data['access']?.toString();
      if (access == null) return null;
      await tokens.save(
        access: access,
        refresh: data['refresh']?.toString() ?? refresh,
      );
      return access;
    } catch (_) {
      return null;
    }
  }

  Future<String?> refreshAccessToken() => _refresh();

  Future<Map<String, dynamic>> getObject(
    String path, {
    Map<String, dynamic>? query,
  }) => _requestObject(() => dio.get<dynamic>(path, queryParameters: query));
  Future<List<dynamic>> getList(
    String path, {
    Map<String, dynamic>? query,
  }) async {
    try {
      return unwrapList(
        (await dio.get<dynamic>(path, queryParameters: query)).data,
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Object? data,
    bool anonymous = false,
  }) => _requestObject(
    () => dio.post<dynamic>(
      path,
      data: data,
      options: Options(extra: {'anonymous': anonymous}),
    ),
  );
  Future<Map<String, dynamic>> patch(String path, {Object? data}) =>
      _requestObject(() => dio.patch<dynamic>(path, data: data));
  Future<void> delete(String path) async {
    try {
      await dio.delete<dynamic>(path);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<Map<String, dynamic>> _requestObject(
    Future<Response<dynamic>> Function() request,
  ) async {
    try {
      return unwrapObject((await request()).data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  static Map<String, dynamic> unwrapObject(dynamic body) {
    final root = Map<String, dynamic>.from(body as Map);
    if (root['success'] == false)
      throw ApiException(
        root['message']?.toString() ?? 'So‘rov bajarilmadi',
        code: root['code']?.toString(),
        errors: root['errors'],
      );
    return Map<String, dynamic>.from(
      (root.containsKey('data') ? root['data'] : root) as Map,
    );
  }

  static List<dynamic> unwrapList(dynamic body) {
    final data = unwrapObject(body);
    return data['results'] is List
        ? List<dynamic>.from(data['results'] as List)
        : const [];
  }
}
