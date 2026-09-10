import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) =>
      throw StateError('SharedPreferences must be initialized in main.dart'),
);

@immutable
class AppSettings {
  const AppSettings({
    required this.onboardingComplete,
    required this.locationSetupComplete,
    required this.themeMode,
  });
  final bool onboardingComplete;
  final bool locationSetupComplete;
  final ThemeMode themeMode;

  AppSettings copyWith({
    bool? onboardingComplete,
    bool? locationSetupComplete,
    ThemeMode? themeMode,
  }) => AppSettings(
    onboardingComplete: onboardingComplete ?? this.onboardingComplete,
    locationSetupComplete: locationSetupComplete ?? this.locationSetupComplete,
    themeMode: themeMode ?? this.themeMode,
  );
}

class AppSettingsController extends StateNotifier<AppSettings> {
  AppSettingsController(this.preferences)
    : super(
        AppSettings(
          onboardingComplete:
              preferences.getBool('onboarding_complete') ?? false,
          locationSetupComplete:
              preferences.getBool('location_setup_complete') ?? false,
          themeMode: _readTheme(preferences.getString('theme_mode')),
        ),
      );

  final SharedPreferences preferences;

  static ThemeMode _readTheme(String? value) => switch (value) {
    'light' => ThemeMode.light,
    'dark' => ThemeMode.dark,
    _ => ThemeMode.system,
  };

  Future<void> completeOnboarding() async {
    await preferences.setBool('onboarding_complete', true);
    state = state.copyWith(onboardingComplete: true);
  }

  Future<void> setTheme(ThemeMode mode) async {
    await preferences.setString('theme_mode', mode.name);
    state = state.copyWith(themeMode: mode);
  }

  Future<void> completeLocationSetup() async {
    await preferences.setBool('location_setup_complete', true);
    state = state.copyWith(locationSetupComplete: true);
  }
}

final appSettingsProvider =
    StateNotifierProvider<AppSettingsController, AppSettings>((ref) {
      return AppSettingsController(ref.watch(sharedPreferencesProvider));
    });
