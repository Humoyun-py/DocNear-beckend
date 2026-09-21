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
python scripts/validate-deploy-env.py .env.staging
./scripts/server-preflight.sh .env.staging docker-compose.staging.example.yml

BACKEND_URL=https://API_DOMAIN \
PATIENT_WEB_URL=https://STAGING_DOMAIN \
DOCTOR_PANEL_URL=https://doctor.STAGING_DOMAIN \
ADMIN_PANEL_URL=https://admin.STAGING_DOMAIN \
CLINIC_OWNER_PANEL_URL=https://owner.STAGING_DOMAIN \
ENABLE_TELEGRAM_BOT=false ENABLE_NGINX=true RUN_SMOKE_TEST=true \
  ./scripts/deploy-staging.sh
```

Replace every `example` domain, placeholder key and certificate path before
starting. Generate a random staging `SECRET_KEY`; never reuse production keys.
The deployment helper validates Compose, starts PostgreSQL/Redis, runs Django
deployment checks, migrations and `collectstatic`, then starts and health-checks
the backend. Telegram and Nginx start only when their explicit flags are true.
External smoke testing is opt-in with `RUN_SMOKE_TEST=true` and requires all
five URL variables shown above. When it is false, the helper reports only the
internal backend health result and explicitly says the external test was
skipped. A requested external smoke test is rejected when Compose Nginx is
disabled, so a private backend is never reported as externally verified.
The Compose backend command also runs idempotent migrations and `collectstatic`
on container recreation. To rerun them explicitly:

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

Pin the staging image or Git commit. `rollback-staging.sh` requires either a full
commit SHA or an immutable image digest, stops Nginx first, displays the migration
plan and never reverses migrations or deletes volumes. Operators must review
schema compatibility before continuing with a rollback.

Before stopping traffic, the helper records whether Nginx and the Telegram bot
are running. A successful rollback restores both services to those exact states;
no `ENABLE_NGINX` or `ENABLE_TELEGRAM_BOT` flag is needed. On failure it prints a
prominent recovery block and restores a previously running Nginx when the
backend state is safe. External rollback smoke testing is separately opt-in via
`RUN_SMOKE_TEST=true` and the five required URL variables.

```bash
./scripts/rollback-staging.sh --commit FULL_GIT_COMMIT_SHA
# or
./scripts/rollback-staging.sh --image registry.example/docnear@sha256:IMAGE_DIGEST
```

Do not use `down -v`. Keep `.env.staging` outside Git and delete it from the
server only through the secret manager’s rotation procedure.

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
