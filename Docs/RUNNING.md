# DocNear local development

## Start backend and web clients

PostgreSQL must be running. Keep populated environment files outside the repo:

```bash
sudo systemctl enable --now postgresql
cd /home/humoyun/DocNear-web-beckend
export DOCNEAR_ENV_FILE="$HOME/docnear-env-backup/repo-root.env"
./run-docnear-dev.sh
```

Services:

| Service | URL |
| --- | --- |
| Django API | `http://127.0.0.1:8001` |
| Patient Web | `http://localhost:3001` |
| Doctor Panel | `http://localhost:3002` |
| Admin Panel | `http://localhost:3003` |
| Clinic Owner Panel | `http://localhost:3004` |

Health check: `http://127.0.0.1:8001/health/`.

Local development uses `OTP_SMS_PROVIDER=console`. The console provider never
prints an OTP. To exercise a deterministic OTP, run only with
`DJANGO_SETTINGS_MODULE=config.settings.test`; its code is `111111`. Never put a
deterministic OTP in development or production settings.

QA phones are:

- Patient: `+998900000001`
- Second patient: `+998900000002`
- Doctor: `+998900000003`
- Clinic owner: `+998900000004`
- Admin: `+998900000005`
- Super admin: `+998900000006`

Create them only in an isolated debug/test database with:

```bash
DJANGO_SETTINGS_MODULE=config.settings.test   .venv/bin/python backend/manage.py seed_qa
```

## Telegram bot

Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_SECRET` and
`DOCNEAR_API_BASE_URL=http://127.0.0.1:8001/api/v1` in the bot process, then:

```bash
cd 'DocNear-web-frontend-main(2)/DocNear-web-frontend-main'
python telegram_bot.py
```

The user runs `/link_phone` and shares the contact button. The bot accepts only
a contact whose Telegram `user_id` matches the sender. `/code` requests a login
OTP, `/code register` requests a registration OTP and `/unlink` disables the
link.

## Run Flutter

Android emulator:

```bash
cd /home/humoyun/DocNear-web-beckend/DocNear-Mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/
```

Physical Android device on the same network:

```bash
flutter run --dart-define=API_BASE_URL=http://YOUR_LAN_IP:8001/api/v1/
```

Or use ADB port reverse and `http://127.0.0.1:8001/api/v1/`:

```bash
~/Android/Sdk/platform-tools/adb reverse tcp:8001 tcp:8001
```

## Test and build APK

```bash
cd /home/humoyun/DocNear-web-beckend/DocNear-Mobile
flutter pub get
flutter analyze
flutter test
flutter build apk --debug   --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/
```

Output: `DocNear-Mobile/build/app/outputs/flutter-apk/app-debug.apk`.
`./run-docnear-mobile.sh` can build, start the configured emulator, install and
open this Flutter app.

For a release, keep the upload keystore outside Git, copy
`android/key.properties.example` to the ignored `android/key.properties`, then
build with the HTTPS production API URL. The Play Console expects an AAB.
