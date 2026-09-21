import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../core/network/api_exception.dart';
import '../../../shared/models/models.dart';

enum AuthStatus { checking, authenticated, unauthenticated }

@immutable
class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.error,
    this.verifying = false,
  });
  const AuthState.checking() : this(status: AuthStatus.checking);
  const AuthState.unauthenticated([String? error])
    : this(status: AuthStatus.unauthenticated, error: error);
  const AuthState.authenticated(UserModel user)
    : this(status: AuthStatus.authenticated, user: user);

  final AuthStatus status;
  final UserModel? user;
  final String? error;
  final bool verifying;
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this.ref) : super(const AuthState.checking()) {
    ref.read(apiClientProvider).onSessionExpired = expireSession;
    restoreSession();
  }

  final Ref ref;

  Future<void> restoreSession() async {
    final hasToken = await ref.read(tokenStoreProvider).readAccess() != null;
    if (!hasToken) {
      state = const AuthState.unauthenticated();
      return;
    }
    try {
      state = AuthState.authenticated(
        await ref.read(authRepositoryProvider).me(),
      );
    } catch (_) {
      await ref.read(tokenStoreProvider).clear();
      state = const AuthState.unauthenticated();
    }
  }

  Future<ApiException?> requestOtp({
    required String phoneNumber,
    required String purpose,
    required String channel,
    String? firstName,
    String? lastName,
  }) async {
    try {
      await ref
          .read(authRepositoryProvider)
          .requestOtp(
            phoneNumber: phoneNumber,
            purpose: purpose,
            channel: channel,
            firstName: firstName,
            lastName: lastName,
          );
      return null;
    } catch (error) {
      return error is ApiException ? error : ApiException(_message(error));
    }
  }

  Future<bool> verifyOtp({
    required String phoneNumber,
    required String code,
    required String purpose,
  }) async {
    if (state.verifying) return false;
    state = const AuthState(
      status: AuthStatus.unauthenticated,
      verifying: true,
    );
    try {
      state = AuthState.authenticated(
        await ref
            .read(authRepositoryProvider)
            .verifyOtp(phoneNumber: phoneNumber, code: code, purpose: purpose),
      );
      return true;
    } catch (error) {
      state = AuthState.unauthenticated(_message(error));
      return false;
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> fields) async {
    try {
      state = AuthState.authenticated(
        await ref.read(authRepositoryProvider).updateProfile(fields),
      );
      return true;
    } catch (error) {
      state = AuthState(
        status: AuthStatus.authenticated,
        user: state.user,
        error: _message(error),
      );
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await ref.read(authRepositoryProvider).logout();
    } catch (_) {
      await ref.read(tokenStoreProvider).clear();
    } finally {
      state = const AuthState.unauthenticated();
    }
  }

  void clearError() =>
      state = AuthState(status: state.status, user: state.user);

  void expireSession() {
    state = const AuthState.unauthenticated(
      'Sessiya tugadi. Iltimos, qayta kiring.',
    );
  }

  String _message(Object error) {
    final message = error.toString();
    return message.startsWith('ApiException: ')
        ? message.substring('ApiException: '.length)
        : message;
  }
}

final authProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});
