# DocNear production deployment

Production authentication is phone OTP for patients and staff. Deploy PostgreSQL
16, an HTTPS API origin, the four web origins, a secret manager, a real SMS
provider and the Telegram bot worker.

## Required backend environment

```text
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=<at least 50 random characters>
DATABASE_URL=<managed PostgreSQL URL>
ALLOWED_HOSTS=api.docnear.uz
CORS_ALLOWED_ORIGINS=https://docnear.uz,https://doctor.docnear.uz,https://admin.docnear.uz,https://owner.docnear.uz
OTP_SMS_PROVIDER=http
SMS_API_URL=<provider HTTPS endpoint>
SMS_API_KEY=<secret>
SMS_SENDER_NAME=DocNear
OTP_EXPIRE_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_PHONE_REQUEST_LIMIT=3
OTP_IP_REQUEST_LIMIT=20
OTP_REQUEST_RATE=5/min
OTP_VERIFY_RATE=10/min
TELEGRAM_BOT_TOKEN=<BotFather token>
TELEGRAM_BOT_USERNAME=<username without @>
TELEGRAM_BOT_WEBHOOK_SECRET=<independent random secret>
TELEGRAM_OTP_ENABLED=true
DOCNEAR_API_BASE_URL=https://api.docnear.uz/api/v1
LEGACY_PASSWORD_AUTH_ENABLED=false
```

Production settings reject the console SMS provider, missing credentials for an
enabled Telegram OTP channel, and enabled legacy password authentication. Adapt `HttpSmsProvider`
payload/response handling to the selected vendor and verify it in staging before
release. Do not put `OTP_TEST_CODE` in a production environment.

Run releases once before scaling replicas:

```bash
python -m pip install -r backend/requirements.txt
python backend/manage.py check --deploy --settings=config.settings.production
python backend/manage.py migrate --noinput --settings=config.settings.production
python backend/manage.py collectstatic --noinput --settings=config.settings.production
gunicorn config.wsgi:application --chdir backend --bind 0.0.0.0:8000 --workers 3
```

Run the Django bot command as a separate supervised process with the same API
base URL, bot token and webhook secret:

```bash
python backend/manage.py run_telegram_bot --settings=config.settings.production
```

The API and every client must use HTTPS.

Build each React app with `VITE_API_BASE_URL=https://api.docnear.uz/api/v1` and
`VITE_TELEGRAM_BOT_USERNAME=<username>`. Build Flutter with:

```bash
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.docnear.uz/api/v1/ \
  --dart-define=TELEGRAM_BOT_USERNAME=<username>
```

Release gates include CI on the exact commit, backup/restore verification,
staging SMS delivery, Telegram link/code/unlink smoke tests, OTP rate-limit
checks and the full booking acceptance flow including `slot_unavailable`.
Keystores, SMS keys, bot tokens, JWTs, OTPs and patient data must not appear in
application or proxy logs.
