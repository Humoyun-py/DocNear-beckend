import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../shared/models/models.dart';

enum AuthStatus { checking, authenticated, unauthenticated }

@immutable
class AuthState {
  const AuthState({required this.status, this.user, this.error});
  const AuthState.checking() : this(status: AuthStatus.checking);
  const AuthState.unauthenticated([String? error])
    : this(status: AuthStatus.unauthenticated, error: error);
  const AuthState.authenticated(UserModel user)
    : this(status: AuthStatus.authenticated, user: user);

  final AuthStatus status;
  final UserModel? user;
  final String? error;
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

  Future<bool> login(String identifier, String password) async {
    state = const AuthState.checking();
    try {
      state = AuthState.authenticated(
        await ref.read(authRepositoryProvider).login(identifier, password),
      );
      return true;
    } catch (error) {
      state = AuthState.unauthenticated(_message(error));
      return false;
    }
  }

  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
  }) async {
    state = const AuthState.checking();
    try {
      state = AuthState.authenticated(
        await ref
            .read(authRepositoryProvider)
            .register(
              firstName: firstName,
              lastName: lastName,
              email: email,
              phone: phone,
              password: password,
            ),
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
