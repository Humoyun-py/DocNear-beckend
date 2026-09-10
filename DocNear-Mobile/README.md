# DocNear Mobile

The official DocNear patient mobile app is built with Flutter and Dart for
Android and iOS.

It uses Material 3, Riverpod, GoRouter, Dio, secure JWT storage, Google Maps,
geolocation, cached network images, local notifications, and shared preferences.
Appointments, favorites, clinicians, clinics, availability, profile data, and
notifications come from the Django REST API.

## Run

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/
```

For a physical phone, replace `10.0.2.2` with the backend computer's LAN IP.
Production builds should use:

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.docnear.uz/api/v1/
```

## Verify

```bash
flutter analyze
flutter test
flutter build apk --debug
```

The debug APK is written to
`build/app/outputs/flutter-apk/app-debug.apk`.

