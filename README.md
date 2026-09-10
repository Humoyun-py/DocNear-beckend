# DocNear

DocNear is a healthcare discovery and appointment platform with a Django REST
backend, Flutter patient app, patient web app, doctor panel, admin panel, and
clinic-owner panel.

The active mobile application is Flutter:

```text
DocNear-Mobile/
```

Start the complete local web/backend environment with:

```bash
./run-docnear-dev.sh
```

Run the Flutter app with:

```bash
cd DocNear-Mobile
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/
```

Full setup, QA accounts, device instructions, and APK build commands are in
[Docs/RUNNING.md](Docs/RUNNING.md).
