import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'network/api_client.dart';
import 'storage/secure_token_store.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/catalog/data/catalog_repositories.dart';
import '../features/appointments/data/appointment_repository.dart';
import '../features/account/data/account_repositories.dart';

final tokenStoreProvider = Provider((ref) => SecureTokenStore());
final apiClientProvider = Provider(
  (ref) => ApiClient(ref.watch(tokenStoreProvider)),
);
final authRepositoryProvider = Provider(
  (ref) => AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(tokenStoreProvider),
  ),
);
final profileRepositoryProvider = Provider(
  (ref) => ProfileRepository(ref.watch(apiClientProvider)),
);
final clinicRepositoryProvider = Provider(
  (ref) => ClinicRepository(ref.watch(apiClientProvider)),
);
final doctorRepositoryProvider = Provider(
  (ref) => DoctorRepository(ref.watch(apiClientProvider)),
);
final searchRepositoryProvider = Provider(
  (ref) => SearchRepository(ref.watch(apiClientProvider)),
);
final emergencyRepositoryProvider = Provider(
  (ref) => EmergencyRepository(ref.watch(apiClientProvider)),
);
final appointmentRepositoryProvider = Provider(
  (ref) => AppointmentRepository(ref.watch(apiClientProvider)),
);
final bookingRepositoryProvider = Provider(
  (ref) => BookingRepository(ref.watch(appointmentRepositoryProvider)),
);
final favoriteRepositoryProvider = Provider(
  (ref) => FavoriteRepository(ref.watch(apiClientProvider)),
);
final notificationRepositoryProvider = Provider(
  (ref) => NotificationRepository(ref.watch(apiClientProvider)),
);
