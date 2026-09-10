import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/account/presentation/account_screens.dart';
import '../features/appointments/presentation/appointment_screens.dart';
import '../features/auth/presentation/auth_controller.dart';
import '../features/auth/presentation/auth_screens.dart';
import '../features/booking/presentation/booking_screens.dart';
import '../features/explore/presentation/detail_screens.dart';
import '../features/explore/presentation/explore_screens.dart';
import '../shared/models/models.dart';
import 'settings_controller.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);
  final settings = ref.watch(appSettingsProvider);
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final path = state.uri.path;
      if (!settings.onboardingComplete) {
        return path == '/onboarding' ? null : '/onboarding';
      }
      if (auth.status == AuthStatus.checking && path != '/splash') {
        return '/splash';
      }
      final public = {'/splash', '/onboarding', '/login', '/register'};
      if (auth.status == AuthStatus.unauthenticated && !public.contains(path)) {
        return '/login';
      }
      if (auth.status == AuthStatus.authenticated && public.contains(path)) {
        return '/location';
      }
      if (auth.status == AuthStatus.authenticated &&
          !settings.locationSetupComplete &&
          path != '/location') {
        return '/location';
      }
      if (auth.status == AuthStatus.authenticated &&
          settings.locationSetupComplete &&
          path == '/location') {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(
        path: '/onboarding',
        builder: (_, __) => const OnboardingScreen(),
      ),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(
        path: '/location',
        builder: (_, __) => const LocationPermissionScreen(),
      ),
      GoRoute(path: '/offline', builder: (_, __) => const OfflineScreen()),
      ShellRoute(
        builder: (context, state, child) =>
            AppShell(location: state.uri.path, child: child),
        routes: [
          GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
          GoRoute(path: '/map', builder: (_, __) => const MapScreen()),
          GoRoute(
            path: '/clinics',
            builder: (_, __) => const ClinicListScreen(),
          ),
          GoRoute(
            path: '/clinics/:id',
            builder: (_, state) =>
                ClinicDetailsScreen(id: int.parse(state.pathParameters['id']!)),
          ),
          GoRoute(
            path: '/doctors',
            builder: (_, state) => DoctorListScreen(
              specialtyId: int.tryParse(
                state.uri.queryParameters['specialty'] ?? '',
              ),
            ),
          ),
          GoRoute(
            path: '/doctors/:id',
            builder: (_, state) =>
                DoctorDetailsScreen(id: int.parse(state.pathParameters['id']!)),
          ),
          GoRoute(
            path: '/appointments',
            builder: (_, __) => const AppointmentsScreen(),
          ),
          GoRoute(
            path: '/appointments/:id',
            builder: (_, state) => AppointmentDetailsScreen(
              id: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/appointments/:id/reschedule',
            builder: (_, state) => RescheduleAppointmentScreen(
              id: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/favorites',
            builder: (_, __) => const FavoritesScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (_, __) => const NotificationsScreen(),
          ),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(
            path: '/profile/edit',
            builder: (_, __) => const EditProfileScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (_, __) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/emergency',
            builder: (_, __) => const EmergencyClinicsScreen(),
          ),
          GoRoute(
            path: '/booking/:doctorId/:clinicId',
            builder: (_, state) => BookingScreen(
              doctorId: int.parse(state.pathParameters['doctorId']!),
              clinicId: int.parse(state.pathParameters['clinicId']!),
            ),
          ),
          GoRoute(
            path: '/booking/confirm',
            builder: (_, state) => state.extra is BookingDraft
                ? BookingConfirmationScreen(draft: state.extra! as BookingDraft)
                : const _MissingRouteData(),
          ),
          GoRoute(
            path: '/booking/success',
            builder: (_, state) => state.extra is AppointmentModel
                ? BookingSuccessScreen(
                    appointment: state.extra! as AppointmentModel,
                  )
                : const _MissingRouteData(),
          ),
        ],
      ),
    ],
  );
});

class _MissingRouteData extends StatelessWidget {
  const _MissingRouteData();
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(),
    body: Center(
      child: FilledButton(
        onPressed: () => context.go('/'),
        child: const Text('Bosh sahifaga qaytish'),
      ),
    ),
  );
}
