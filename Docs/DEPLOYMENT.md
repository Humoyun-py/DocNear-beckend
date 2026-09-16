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
TELEGRAM_DELETE_WEBHOOK_ON_START=false
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

## Deployment options

For a small host, copy `deploy/systemd/*.service` to `/etc/systemd/system/`,
store the populated environment at `/etc/docnear/docnear.production.env` with
mode `0600`, then run migrations and static collection before enabling the
services. The service files run Gunicorn and the Telegram worker separately.

For container deployment, copy `.env.production.example` to a server-only
`.env.production`, set the matching `POSTGRES_*` variables in the shell, review
the image tags and certificate paths, then use:

```bash
docker compose -f docker-compose.production.example.yml build
docker compose -f docker-compose.production.example.yml up -d
docker compose -f docker-compose.production.example.yml exec backend python manage.py createsuperuser --settings=config.settings.production
```

Before any production start, run the non-secret host and environment gates:

```bash
./scripts/server-preflight.sh .env.production docker-compose.production.example.yml
python scripts/validate-deploy-env.py .env.production
docker compose --env-file .env.production -f docker-compose.production.example.yml config --quiet
```

The compose file is a template: replace example domains/certificates, use a
managed database or harden the included PostgreSQL volume, and keep all ports
except Nginx private.

## Static, media and SMS

`collectstatic` writes `STATIC_ROOT`; Nginx serves it from the shared static
volume. User profile, doctor and clinic images are under `MEDIA_ROOT`. For more
than one host set `AWS_STORAGE_BUCKET_NAME` and use a private S3-compatible
bucket with lifecycle/versioning; serve media through signed URLs or a private
CDN rather than a public bucket. Test upload, download and deletion policy.

`apps.accounts.sms.HttpSmsProvider` is the vendor-neutral adapter. Select a
provider only after adapting its JSON payload and response status in staging;
provide an HTTPS endpoint and secret through the environment. Production rejects
the console provider and refuses startup when the HTTP adapter is incomplete.

## Release signing

Generate a release keystore on a protected build machine, keep its password and
`DocNear-Mobile/android/key.properties` outside Git, and use the ignored
`key.properties.example` as the shape. Restrict Maps keys by package/SHA-1 on
Android and bundle ID on iOS. Build the signed AAB with the HTTPS command in
`Docs/RUNNING.md`; install it on a real device before publishing.

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

## Security requirements after the September 2026 audit

Production now requires a non-placeholder random `SECRET_KEY`, explicit
`ALLOWED_HOSTS`, exact HTTPS CORS origins, an HTTPS SMS endpoint, and a shared
`REDIS_URL`. `DEBUG=true`, wildcard hosts/origins and console SMS fail startup.
Keep `TRUSTED_PROXY_COUNT=0` unless the exact reverse-proxy chain is configured,
forwarded headers are overwritten, and direct backend access is blocked.

Android release requests require an HTTPS `API_BASE_URL`; HTTP is allowed only
in the debug manifest. A debug emulator build is not a production distribution.

When `GEMINI_API_KEY` is configured, the web AI endpoints require a patient JWT
validated against `DOCNEAR_API_BASE_URL` (default: local backend). They also apply
a per-process socket-IP limit of 10 requests/minute. Multi-instance production
needs an edge/shared quota and a provider spending cap; no proxy header is trusted
by this limiter. Frontend browser tokens remain in sessionStorage and therefore
remain accessible to scripts running in the same origin.
