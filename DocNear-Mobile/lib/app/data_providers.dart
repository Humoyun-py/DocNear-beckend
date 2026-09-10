import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../core/providers.dart';
import '../shared/models/models.dart';

class UserLocation {
  const UserLocation(this.latitude, this.longitude, {this.manual = false});
  final double latitude;
  final double longitude;
  final bool manual;
}

class LocationController extends StateNotifier<AsyncValue<UserLocation>> {
  LocationController() : super(const AsyncLoading()) {
    locate();
  }

  static const tashkent = UserLocation(41.3111, 69.2797, manual: true);

  Future<void> locate() async {
    state = const AsyncLoading();
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        state = const AsyncData(tashkent);
        return;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        state = const AsyncData(tashkent);
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 12),
        ),
      );
      state = AsyncData(UserLocation(position.latitude, position.longitude));
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
    }
  }

  void useTashkent() => state = const AsyncData(tashkent);
}

final locationProvider =
    StateNotifierProvider<LocationController, AsyncValue<UserLocation>>(
      (ref) => LocationController(),
    );

final clinicsProvider = FutureProvider<List<ClinicModel>>((ref) {
  return ref.watch(clinicRepositoryProvider).getClinics();
});

final doctorsProvider = FutureProvider<List<DoctorModel>>((ref) {
  return ref.watch(doctorRepositoryProvider).getDoctors();
});

final specialtiesProvider = FutureProvider<List<SpecialtyModel>>((ref) {
  return ref.watch(doctorRepositoryProvider).getSpecialties();
});

final nearbyClinicsProvider = FutureProvider<List<ClinicModel>>((ref) async {
  final location =
      ref.watch(locationProvider).valueOrNull ?? LocationController.tashkent;
  return ref
      .watch(clinicRepositoryProvider)
      .getNearby(location.latitude, location.longitude);
});

final emergencyClinicsProvider = FutureProvider<List<ClinicModel>>((ref) async {
  final location =
      ref.watch(locationProvider).valueOrNull ?? LocationController.tashkent;
  return ref
      .watch(clinicRepositoryProvider)
      .getNearby(location.latitude, location.longitude, emergency: true);
});

final appointmentsProvider = FutureProvider<List<AppointmentModel>>((ref) {
  return ref.watch(appointmentRepositoryProvider).getMine();
});

final favoriteDoctorsProvider = FutureProvider<List<DoctorModel>>((ref) {
  return ref.watch(favoriteRepositoryProvider).doctors();
});

final favoriteClinicsProvider = FutureProvider<List<ClinicModel>>((ref) {
  return ref.watch(favoriteRepositoryProvider).clinics();
});

final notificationsProvider = FutureProvider<List<NotificationModel>>((ref) {
  return ref.watch(notificationRepositoryProvider).list();
});

final clinicDetailsProvider = FutureProvider.family<ClinicModel, int>(
  (ref, id) => ref.watch(clinicRepositoryProvider).getDetails(id),
);

final doctorDetailsProvider = FutureProvider.family<DoctorModel, int>(
  (ref, id) => ref.watch(doctorRepositoryProvider).getDetails(id),
);

final appointmentDetailsProvider = FutureProvider.family<AppointmentModel, int>(
  (ref, id) => ref.watch(appointmentRepositoryProvider).getDetails(id),
);

class AvailabilityQuery {
  const AvailabilityQuery(this.doctorId, this.clinicId, this.date);
  final int doctorId;
  final int clinicId;
  final String date;
  @override
  bool operator ==(Object other) =>
      other is AvailabilityQuery &&
      doctorId == other.doctorId &&
      clinicId == other.clinicId &&
      date == other.date;
  @override
  int get hashCode => Object.hash(doctorId, clinicId, date);
}

final availabilityProvider =
    FutureProvider.family<AvailabilityResponseModel, AvailabilityQuery>(
      (ref, query) => ref
          .watch(doctorRepositoryProvider)
          .getAvailability(query.doctorId, query.clinicId, query.date),
    );
