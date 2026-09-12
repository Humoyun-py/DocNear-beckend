# DocNear local development

## Start backend and web clients

PostgreSQL must be running. Keep the populated local file in the ignored
`.runtime/` directory:

```bash
sudo systemctl enable --now postgresql
cd /home/humoyun/DocNear-web-beckend
mkdir -p .runtime
cp .env.example .runtime/local.env
# Edit .runtime/local.env and replace placeholders before continuing.
chmod 700 .runtime
chmod 600 .runtime/local.env
DOCNEAR_ENV_FILE=.runtime/local.env ./run-docnear-dev.sh
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

Set these values in `.runtime/local.env` without committing the file:

```text
TELEGRAM_OTP_ENABLED=true
TELEGRAM_BOT_TOKEN=<BotFather token>
TELEGRAM_BOT_USERNAME=<username without @>
TELEGRAM_BOT_WEBHOOK_SECRET=<random local secret>
DOCNEAR_API_BASE_URL=http://127.0.0.1:8001/api/v1
```

Keep `run-docnear-dev.sh` running, then start the bot in another terminal:

```bash
cd /home/humoyun/DocNear-web-beckend
source .venv/bin/activate
DOCNEAR_ENV_FILE=.runtime/local.env python backend/manage.py run_telegram_bot --settings=config.settings.development
```

The user sends `/start`, then `/link_phone`, and shares the contact button. The
bot accepts only a contact whose Telegram `user_id` matches the sender. `/code`
requests a login OTP, `/code register` requests a registration OTP, and
`/unlink` disables the link. The backend generates, hashes and sends the OTP;
the polling process does not store it.

Use `https://t.me/<TELEGRAM_BOT_USERNAME>` or the “Telegram botni ochish” link
on a configured login screen. Telegram OTP is unavailable when
`TELEGRAM_OTP_ENABLED=false`.

## Run Flutter

Android emulator:

```bash
cd /home/humoyun/DocNear-web-beckend/DocNear-Mobile
flutter pub get
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/ \
  --dart-define=TELEGRAM_BOT_USERNAME=YOUR_BOT_USERNAME
```

Physical Android device on the same network:

```bash
flutter run \
  --dart-define=API_BASE_URL=http://YOUR_LAN_IP:8001/api/v1/ \
  --dart-define=TELEGRAM_BOT_USERNAME=YOUR_BOT_USERNAME
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
flutter build apk --debug \
  --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/ \
  --dart-define=TELEGRAM_BOT_USERNAME=YOUR_BOT_USERNAME
```

Output: `DocNear-Mobile/build/app/outputs/flutter-apk/app-debug.apk`.
`./run-docnear-mobile.sh` can build, start the configured emulator, install and
open this Flutter app.

For a release, keep the upload keystore outside Git, copy
`android/key.properties.example` to the ignored `android/key.properties`, then
build with the HTTPS production API URL. The Play Console expects an AAB.
