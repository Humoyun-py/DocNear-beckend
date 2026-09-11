# DocNear production deployment

This runbook describes production requirements. Do not use QA accounts,
development signing, the Django development server, or local `.env` files in a
public deployment.

## Required infrastructure

- Linux application host or container runtime.
- Managed PostgreSQL 16 or compatible newer version with backups.
- HTTPS reverse proxy/load balancer for the API and React clients.
- Secret manager for all credentials.
- SMTP or transactional email provider.
- S3-compatible private media storage.
- Optional Redis for shared cache and Celery broker/results.

## Backend environment

Start from `.env.example`, then store real values in the deployment platform's
secret/config system. Production startup requires:

```text
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=<unique random value of at least 50 characters>
DATABASE_URL=<managed PostgreSQL connection URL>
ALLOWED_HOSTS=api.docnear.uz
CORS_ALLOWED_ORIGINS=https://docnear.uz,https://doctor.docnear.uz,https://admin.docnear.uz,https://owner.docnear.uz
PASSWORD_RESET_URL=https://docnear.uz/reset-password
```

`CORS_ALLOWED_ORIGINS` must contain HTTPS origins only. Set `TRUST_PROXY=true`
only when the trusted reverse proxy overwrites `X-Forwarded-Proto`.

Configure email:

```text
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=<provider host>
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=<secret>
EMAIL_HOST_PASSWORD=<secret>
DEFAULT_FROM_EMAIL=DocNear <noreply@docnear.uz>
```

Configure S3-compatible media storage with `AWS_STORAGE_BUCKET_NAME`, provider
credentials, region, and `AWS_S3_ENDPOINT_URL` when the provider requires it.

Generate a separate random `TELEGRAM_BOT_SECRET`; the deployed bot sends it in
the backend header. Keep the Telegram platform token in the bot service only.

## Backend release commands

From the repository root in the release image/environment:

```bash
python -m pip install -r backend/requirements.txt
python backend/manage.py check --deploy --settings=config.settings.production
python backend/manage.py migrate --noinput --settings=config.settings.production
python backend/manage.py collectstatic --noinput --settings=config.settings.production
gunicorn config.wsgi:application \
  --chdir backend \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --access-logfile - \
  --error-logfile -
```

Route the load balancer health check to `/health/`. Apply migrations once per
release before increasing application replicas.

Do not log Authorization headers, reset URLs, passwords, patient notes, or
private health information. Configure provider-side log access and retention.

## React clients

Build each client with the public API URL:

```bash
VITE_API_BASE_URL=https://api.docnear.uz/api/v1 npm ci
VITE_API_BASE_URL=https://api.docnear.uz/api/v1 npm run lint
VITE_API_BASE_URL=https://api.docnear.uz/api/v1 npm run build
```

Run these commands inside each React project. Deploy the doctor, admin, and
clinic owner `dist/` directories as static sites with SPA route fallback. The
patient web app also builds `dist/server.js`; start it with `npm run start` and
set `PORT` when using its Node server.

Only variables prefixed with `VITE_` become browser-visible. Never give a Vite
variable a database, Telegram, Gemini, SMTP, or Django secret.

## Android

Place the owner-controlled upload keystore outside Git. Copy
`DocNear-Mobile/android/key.properties.example` to the ignored
`DocNear-Mobile/android/key.properties` and enter its path and passwords.

Put a package-restricted Maps key in a secure Gradle property/environment value
named `GOOGLE_MAPS_API_KEY`. Then build:

```bash
cd DocNear-Mobile
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.docnear.uz/api/v1/ \
  --dart-define=GOOGLE_MAPS_ENABLED=true
```

Verify the signer and upload the AAB to an internal Play track before wider
release. The existing `artifacts/DocNear-release.*` files use development
signing and are for QA only.

## iOS

On macOS/Xcode, configure the production bundle signing team and the
`GOOGLE_MAPS_API_KEY` build setting, then run Flutter analysis/tests and build
an archive. Test location permission, map rendering, secure token restoration,
notifications, booking, and universal links on a physical device.

## Release gates

- GitHub Actions CI passes on the exact release commit.
- Database backup and restore are tested.
- Production deploy check reports no issues.
- Health check succeeds through the public HTTPS endpoint.
- CORS allows only the deployed client origins.
- Password-reset email works without account enumeration.
- Booking acceptance flow passes against a staging database.
- Second patient receives `slot_unavailable` for the occupied slot.
- Doctor, patient, admin, and clinic owner see the same Booking ID/status.
- Android/iOS release artifacts use owner-controlled signing credentials.
- Maps keys are platform/application restricted.
- Telegram webhook and background delivery are smoke-tested.
- Rollback steps and on-call ownership are documented by the deployment team.
