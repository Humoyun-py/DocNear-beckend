# DocNear staging deployment

Staging is an isolated rehearsal environment. It may use test patient data and
staging-only SMS/Telegram credentials, but it must not receive production data,
tokens or database backups. This guide does not deploy to a real server.

## Requirements

Install Docker Engine with Compose v2, Git, a DNS name for the staging API and
frontend origins, an HTTPS certificate, and access to a staging SMS provider and
separate Telegram bot. Keep the server firewall limited to 80/443; PostgreSQL,
Redis and port 8000 remain private.

## Configure and start

```bash
cp .env.staging.example .env.staging
chmod 600 .env.staging
# Edit .env.staging through a secret manager or protected editor.
# Also set POSTGRES_PASSWORD in the shell or a server-only Compose env file.
export POSTGRES_PASSWORD='staging-only-password'
docker compose -f docker-compose.staging.example.yml config
docker compose -f docker-compose.staging.example.yml build
docker compose -f docker-compose.staging.example.yml up -d
```

Replace every `example` domain, placeholder key and certificate path before
starting. Generate a random staging `SECRET_KEY`; never reuse production keys.
The compose backend runs migrations and `collectstatic` on startup. To rerun
them explicitly:

```bash
docker compose -f docker-compose.staging.example.yml exec backend \
  python manage.py migrate --noinput --settings=config.settings.production
docker compose -f docker-compose.staging.example.yml exec backend \
  python manage.py collectstatic --noinput --settings=config.settings.production
```

The Telegram worker is a separate service. Confirm it uses the staging bot and
that private-chat phone linking works before testing OTP. Use the staging SMS
provider only; do not use a production sender or real patient list.

## Smoke test and logs

```bash
BACKEND_URL=https://api.staging.example \
PATIENT_WEB_URL=https://staging.example \
DOCTOR_PANEL_URL=https://doctor.staging.example \
ADMIN_PANEL_URL=https://admin.staging.example \
CLINIC_OWNER_PANEL_URL=https://owner.staging.example \
  ./scripts/staging-smoke-test.sh

docker compose -f docker-compose.staging.example.yml ps
docker compose -f docker-compose.staging.example.yml logs --tail=200 backend telegram-bot nginx
```

Logs must not contain Authorization headers, OTP values, SMS keys, Telegram
tokens, full phone numbers or request bodies. Check HTTPS headers and the health
endpoint from outside the host.

## Rollback and cleanup

Pin the staging image or Git commit. To roll back, stop Nginx traffic, deploy the
previous image, run `check --deploy`, verify migration compatibility, restart the
backend and worker, then rerun the smoke test. Restore only a staging backup in
an isolated database; do not run destructive SQL against production.

```bash
docker compose -f docker-compose.staging.example.yml down
```

Do not use `down -v` unless the staging database and Redis volumes are
deliberately being destroyed. Keep `.env.staging` outside Git and delete it from
the server only through the secret manager’s rotation procedure.

## Common errors

- **Production settings reject startup:** replace all placeholders and ensure
  origins are HTTPS, explicit, and comma-separated.
- **Postgres unhealthy:** verify `POSTGRES_*` values match `DATABASE_URL`; wait
  for the healthcheck before rerunning migrations.
- **Redis/throttling errors:** use one shared `REDIS_URL` for every backend
  replica and keep Redis reachable only on the private network.
- **502 from Nginx:** check backend health, upstream name `backend:8000`, and
  certificate mounts.
- **Telegram does not deliver:** confirm the staging token, webhook secret,
  private chat link and that only one worker is polling the staging bot.
- **SMS fails:** verify the vendor HTTPS URL, staging API key, sender approval
  and the adapter payload in the vendor sandbox.
