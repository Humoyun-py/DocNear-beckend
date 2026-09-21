# DocNear Flutter migration report

Status: completed for local development and QA on 2026-09-09.

## Migration summary

- Created the active Flutter Android/iOS project in `mobile/flutter`.
- Removed the retired Jetpack Compose project after completing and verifying
  the Flutter replacement.
- Updated the mobile launcher, root README, and run guide to use Flutter.
- Kept the working Django API contract as the source of truth.

## Flutter application

The app uses Material 3, Riverpod, GoRouter, Dio, Flutter Secure Storage,
Google Maps Flutter, Geolocator, Cached Network Image, SharedPreferences,
Flutter Local Notifications, Lottie, and Lucide icons.

Implemented flows include:

- Splash, onboarding, login, registration, JWT restoration and refresh.
- Location permission with an explicit manual Tashkent fallback.
- Home, search, nearby clinics, 5 km map, clinic details, and doctor details.
- Backend availability, booking confirmation, Booking ID success, and
  `slot_unavailable` recovery.
- Upcoming/past/cancelled appointments, details, cancellation, and reschedule.
- Backend favorites, backend notifications, profile edit, theme settings, and
  emergency-capable partnered clinics.
- Loading, empty, retry/offline states and light/dark/system themes.

All interface icons use Lucide or Material vector icons. The Flutter UI source
contains no emoji characters.

## Verification

- `flutter pub get`: passed.
- `flutter analyze`: passed with `No issues found`.
- `flutter test`: 8 passed; the opt-in live test is skipped in the normal run.
- Live Flutter repository test: 1 passed against the isolated Django QA server.
- `flutter build apk --debug`: passed.
- `flutter build apk --release`: passed with the production API URL.
- `flutter build appbundle --release`: passed with the production API URL.
- Android install: passed on `emulator-5554`.
- Activity smoke test: `com.docnear.app/.MainActivity` started, the process was
  alive, and no fatal exception was present in the recent device log.

The live Flutter test verified:

1. Patient login returned JWT tokens.
2. Clinics and doctors loaded through the response envelope.
3. Doctor availability loaded from the backend.
4. Appointment creation returned HTTP 201 and a Booking ID.
5. My Appointments contained the same Booking ID.
6. A second patient received HTTP 409 with `slot_unavailable` for the same slot.
7. The test appointment was cancelled during cleanup.

## APK outputs

- Debug: `artifacts/DocNear-debug.apk`
- Optimized release build with development signing:
  `artifacts/DocNear-release.apk`
- Play Store App Bundle with development signing:
  `artifacts/DocNear-release.aab`
- Debug SHA-256:
  `881f5ca24a74c32f36614e37f43905385910a1f86168fdaaf7f6382586670bdd`
- Release SHA-256:
  `6a346b8432f805e5ae00d1137a0f43f1c2f842abab073148071bbf79cad002c8`
- App Bundle SHA-256:
  `de76b2f87da1b5340d1a2c62c32bde1eddd8f6b3c7dede442f4f2b48e31134b4`
- Application ID: `com.docnear.app`
- Minimum Android SDK: 24
- Target Android SDK: 36

## Remaining production work

- Add the owner's protected production Android keystore before Play Store
  distribution. Secure signing support and `android/key.properties.example`
  are ready; the current release APK remains development-signed until the owner
  supplies the private key and passwords.
- Add a valid Google Maps key to Gradle/Xcode configuration for map tiles.
- Run the iOS build and device test on macOS with Xcode; this Linux environment
  cannot compile an iOS archive.
- Configure the final production API domain, HTTPS deployment, allowed hosts,
  and CORS origins before public release.
