# DocNear

DocNear is a healthcare discovery and appointment platform with a Django REST
backend, Flutter patient app, patient web app, doctor panel, admin panel and
clinic owner panel.

Production authentication is phone only. Patients and staff request a six digit
OTP by SMS, verify it, and receive JWT access and refresh tokens. A user may
also receive the OTP through the DocNear Telegram bot after sharing their own
contact with the bot. Email remains an optional legacy/profile field and is not
a login identifier in any client.

Start the local backend and all web clients:

```bash
export DOCNEAR_ENV_FILE="$HOME/docnear-env-backup/repo-root.env"
./run-docnear-dev.sh
```

Run the Flutter app on an Android emulator:

```bash
cd DocNear-Mobile
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/
```

See [Docs/RUNNING.md](Docs/RUNNING.md) for setup and APK commands,
[Docs/api-contract-v1.md](Docs/api-contract-v1.md) for the OTP API and
[Docs/DEPLOYMENT.md](Docs/DEPLOYMENT.md) for production SMS and Telegram setup.
CI checks PostgreSQL migrations/tests, every React build, Flutter analysis/tests
and a debug APK build.
