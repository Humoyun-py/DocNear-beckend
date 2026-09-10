# DocNear local development

DocNear Mobile is a Flutter application. The repository contains one active
mobile project: `DocNear-Mobile`.

## Start the backend and web panels

PostgreSQL must be running. From the repository root:

```bash
sudo systemctl enable --now postgresql
cd /home/humoyun/DocNear-web-beckend
./run-docnear-dev.sh
```

The script starts:

| Service | URL |
| --- | --- |
| Django API | `http://127.0.0.1:8001` |
| Patient Web | `http://localhost:3001` |
| Doctor Panel | `http://localhost:3002` |
| Admin Panel | `http://localhost:3003` |
| Clinic Owner Panel | `http://localhost:3004` |

Health check: `http://127.0.0.1:8001/health/`.

## Run Flutter on an Android emulator

Start an Android emulator, then run:

```bash
cd /home/humoyun/DocNear-web-beckend/DocNear-Mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/
```

The Android build uses JDK 21. If Flutter selects an incompatible JDK, point it
to the installed JDK 21 once, then rerun the command above:

```bash
flutter config --jdk-dir=/home/humoyun/.minecraft/runtime/java-runtime-delta/linux/java-runtime-delta
flutter doctor -v
```

For Google Maps, put this line in the user-level Gradle properties file
`~/.gradle/gradle.properties`:

```properties
GOOGLE_MAPS_API_KEY=your_android_maps_key
```

For iOS, set the `GOOGLE_MAPS_API_KEY` build setting in Xcode. Location and
local-network permissions are already declared in the platform projects.

## Run on a physical Android phone

Use the computer's LAN address:

```bash
flutter run --dart-define=API_BASE_URL=http://YOUR_LAN_IP:8001/api/v1/
```

Alternatively, connect the phone over ADB and forward the backend port:

```bash
~/Android/Sdk/platform-tools/adb reverse tcp:8001 tcp:8001
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:8001/api/v1/
```

## Test and build the Flutter APK

```bash
cd /home/humoyun/DocNear-web-beckend/DocNear-Mobile
flutter clean
flutter pub get
flutter analyze
flutter test
flutter build apk --debug \
  --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/
```

APK output:

```text
DocNear-Mobile/build/app/outputs/flutter-apk/app-debug.apk
```

Ready-to-install copies produced by the verified build are available at:

```text
artifacts/DocNear-debug.apk
artifacts/DocNear-release-dev-signed.apk
artifacts/DocNear-release-dev-signed.aab
```

The release artifact is optimized but currently uses the development signing
key. Configure the owner's protected release keystore before Play Store upload.

## Configure production Android signing

Create and protect an upload key outside the repository:

```bash
keytool -genkeypair -v \
  -keystore "$HOME/docnear-upload-key.jks" \
  -alias docnear-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Copy the provided template and insert the real path and passwords:

```bash
cd /home/humoyun/DocNear-web-beckend/DocNear-Mobile/android
cp key.properties.example key.properties
```

`android/key.properties` and `*.jks` are ignored by Git. When this file exists,
the release build automatically uses that keystore and rejects incomplete
properties. Build the signed production APK with:

```bash
cd /home/humoyun/DocNear-web-beckend/DocNear-Mobile
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.docnear.uz/api/v1/
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.docnear.uz/api/v1/
```

The APK is used for direct installation. Google Play Console expects the AAB.

The repository launcher builds the APK when missing, starts the configured
emulator, installs the current Flutter APK, and opens DocNear:

```bash
cd /home/humoyun/DocNear-web-beckend
./run-docnear-mobile.sh
```

To install the already-built debug APK manually:

```bash
~/Android/Sdk/platform-tools/adb install --no-streaming -r \
  /home/humoyun/DocNear-web-beckend/artifacts/DocNear-debug.apk
~/Android/Sdk/platform-tools/adb shell am start \
  -n com.docnear.app/.MainActivity
```

## Development QA accounts

All local QA users use the password `DocnearQA2026!`:

- Patient: `qa.patient@docnear.example`
- Second patient: `qa.patient-b@docnear.example`
- Doctor: `qa.doctor@docnear.example`
- Admin: `qa.admin@docnear.example`
- Clinic owner: `qa.owner@docnear.example`

These accounts are for local development only and are not embedded in the app.
