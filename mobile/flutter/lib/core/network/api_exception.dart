import 'package:dio/dio.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.code, this.statusCode, this.errors});
  final String message;
  final String? code;
  final int? statusCode;
  final Object? errors;
  bool get isSlotUnavailable => code == 'slot_unavailable' || statusCode == 409;

  factory ApiException.fromDio(DioException error) {
    final body = error.response?.data;
    if (body is Map) {
      return ApiException(
        body['message']?.toString() ?? _fallback(error),
        code: body['code']?.toString(),
        statusCode: error.response?.statusCode,
        errors: body['errors'],
      );
    }
    return ApiException(
      _fallback(error),
      statusCode: error.response?.statusCode,
    );
  }
  static String _fallback(DioException error) => switch (error.type) {
    DioExceptionType.connectionTimeout ||
    DioExceptionType.receiveTimeout ||
    DioExceptionType.sendTimeout =>
      'Server javob bermadi. Internet aloqasini tekshiring.',
    DioExceptionType.connectionError =>
      'Internet yoki server bilan aloqa yo‘q.',
    _ => 'So‘rov bajarilmadi. Qayta urinib ko‘ring.',
  };
  @override
  String toString() => message;
}
