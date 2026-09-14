# DocNear local and production runbook

## Local development

PostgreSQL must be running. Keep populated local values in the ignored
`.runtime/local.env` file with mode `0600`:

```bash
sudo systemctl enable --now postgresql
cd /home/humoyun/DocNear-web-beckend
mkdir -p .runtime
cp .env.example .runtime/local.env
chmod 700 .runtime && chmod 600 .runtime/local.env
DOCNEAR_ENV_FILE=.runtime/local.env ./run-docnear-dev.sh
```

The local API is `http://127.0.0.1:8001`; patient, doctor, admin and owner
panels use ports 3001–3004. Health check: `http://127.0.0.1:8001/health/`.
Local OTP uses the console sink and never prints codes. Deterministic `111111`
is available only with `config.settings.test` in an isolated QA database.

## Local Telegram bot

Set Telegram values only in `.runtime/local.env`, then run in a separate
terminal:

```bash
DOCNEAR_ENV_FILE=.runtime/local.env .venv/bin/python backend/manage.py run_telegram_bot --settings=config.settings.development
```

Diagnostics never print tokens or chat IDs:

```bash
DOCNEAR_ENV_FILE=.runtime/local.env .venv/bin/python backend/manage.py telegram_status --settings=config.settings.development
DOCNEAR_ENV_FILE=.runtime/local.env .venv/bin/python backend/manage.py telegram_links --settings=config.settings.development
DOCNEAR_ENV_FILE=.runtime/local.env .venv/bin/python backend/manage.py otp_status --settings=config.settings.development
```

## Local mobile and checks

```bash
cd DocNear-Mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/
flutter analyze && flutter test
```

For a physical phone use the computer LAN address. For an emulator, `10.0.2.2`
maps to the host. Run React `npm ci`, `npm run lint`, `npm run test --if-present`
and `npm run build` in each panel directory.

## Production runbook

## Backend

Create `/etc/docnear/docnear.production.env` on the server with mode `0600`
from `.env.production.example`; populate it through the server secret manager.
Never copy `.runtime/local.env` or a developer `.env` to production.

```bash
cd /srv/docnear
python -m venv .venv && .venv/bin/pip install -r backend/requirements.txt
DOCNEAR_ENV_FILE=/etc/docnear/docnear.production.env .venv/bin/python backend/manage.py check --deploy --settings=config.settings.production
.venv/bin/python backend/manage.py migrate --noinput --settings=config.settings.production
.venv/bin/python backend/manage.py collectstatic --noinput --settings=config.settings.production
sudo systemctl enable --now docnear-backend docnear-telegram-bot
```

Run Nginx with the example in `deploy/nginx/`, install a certificate with an ACME
client, and allow only 80/443 at the public firewall. Keep port 8000 private.

## Web panels

Set `VITE_API_BASE_URL=https://api.docnear.uz/api/v1` and the non-secret
`VITE_TELEGRAM_BOT_USERNAME` per panel, run `npm ci && npm run build`, then serve
each `dist/` directory behind HTTPS. Google Maps keys are browser keys and must
be restricted by API and allowed origins.

## Flutter release

```bash
cd DocNear-Mobile
flutter pub get
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.docnear.uz/api/v1/ \
  --dart-define=TELEGRAM_BOT_USERNAME=DocNearBot
```

Use `android/key.properties` only on the build machine; it is ignored by Git.
Install the signed AAB on a real device and verify OTP, Telegram linking, maps,
booking conflict handling and logout.
