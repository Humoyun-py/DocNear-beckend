# DocNear server preparation

This runbook prepares a future Ubuntu 24.04 VPS without deploying to a real
server from this repository. Replace only the documented placeholders on the
server. Never commit environment files, credentials, database dumps, private
keys or certificates.

## 1. VPS and SSH

Provision Ubuntu 24.04 LTS with sufficient CPU, RAM and disk. Connect using an
individual SSH key and a non-root sudo user:

```bash
ssh deploy@SERVER_IP
```

Keep public-key authentication, host firewall policy and provider recovery
access enabled. The bootstrap does not change SSH configuration or enable UFW.

## 2. Non-secret system bootstrap

Copy only `scripts/server-bootstrap.sh` to the host after reviewing it, then run:

```bash
chmod 750 scripts/server-bootstrap.sh
./scripts/server-bootstrap.sh
```

It verifies Ubuntu 24.04, installs Git, curl, CA certificates and utilities,
installs/verifies Docker Engine with Compose v2, enables Docker, creates
`/srv/docnear` directories and prints firewall recommendations. It never opens
PostgreSQL/Redis, clones a private repository or configures secrets.
For a non-root operator it adds that user to Docker's root-equivalent group;
log out and back in once, and restrict membership to trusted deploy operators.

Review the suggested UFW rules separately. Only SSH, TCP 80 and TCP 443 should
be public; never publish 5432, 6379 or 8000.

## 3. Repository clone

Use a read-only deploy key or another scoped credential. Do this manually:

```bash
cd /srv/docnear/releases
git clone PRIVATE_REPOSITORY_URL docnear
cd docnear
git switch feature/server-readiness
git rev-parse HEAD
```

Pin and record the reviewed commit. Do not place access tokens in the clone URL
or shell history.

## 4. Environment and secrets

Create the staging file from the tracked shape and restrict it before editing:

```bash
cp .env.staging.example .env.staging
chmod 600 .env.staging
SECRET_EDITOR .env.staging
python scripts/validate-deploy-env.py .env.staging
```

Replace every example/`replace_me` value. Generate independent random values for
`SECRET_KEY`, `POSTGRES_PASSWORD`, SMS and Telegram credentials using an approved
secret manager. Keep `DATABASE_URL` consistent with `POSTGRES_DB`,
`POSTGRES_USER` and `POSTGRES_PASSWORD`. Production uses `.env.production` and
must never reuse staging secrets or data.

## 5. DNS

Create DNS records only after the server address is assigned:

```text
STAGING_DOMAIN        A/AAAA -> SERVER_IP
API_DOMAIN            A/AAAA -> SERVER_IP
doctor.STAGING_DOMAIN A/AAAA -> SERVER_IP
admin.STAGING_DOMAIN  A/AAAA -> SERVER_IP
owner.STAGING_DOMAIN  A/AAAA -> SERVER_IP
```

Wait for authoritative DNS propagation and verify records from outside the VPS.

## 6. HTTPS certificates

Obtain certificates using an approved ACME client only after DNS is correct.
Place the API certificate and key in the server-only path mounted by the Nginx
Compose service. Certificate private keys must be mode `0600`, outside Git and
readable only by the deployment mechanism. Update the Nginx template to
`API_DOMAIN`, validate it and test renewal before enabling traffic.

## 7. Preflight and Compose validation

```bash
./scripts/server-preflight.sh .env.staging docker-compose.staging.example.yml
python scripts/validate-deploy-env.py .env.staging
docker compose --env-file .env.staging \
  -f docker-compose.staging.example.yml config --quiet
```

Preflight is blocking on the OS, minimum resources, Docker/Git, env safety and
Compose validity. Existing listeners on 80/443 are warnings that must be
identified. No secret value is printed.

## 8. Staging release

After DNS and certificates are ready, provide the public smoke-test URLs.
Telegram may remain disabled, while Nginx is enabled explicitly:

```bash
BACKEND_URL=https://API_DOMAIN \
PATIENT_WEB_URL=https://STAGING_DOMAIN \
DOCTOR_PANEL_URL=https://doctor.STAGING_DOMAIN \
ADMIN_PANEL_URL=https://admin.STAGING_DOMAIN \
CLINIC_OWNER_PANEL_URL=https://owner.STAGING_DOMAIN \
ENABLE_TELEGRAM_BOT=false ENABLE_NGINX=true RUN_SMOKE_TEST=true \
  ./scripts/deploy-staging.sh
```

If another reviewed reverse proxy already provides the URLs, Nginx may remain
disabled explicitly. The helper builds images, starts and waits for PostgreSQL/Redis, runs
`check --deploy`, forward migrations and `collectstatic`, starts the backend,
waits for health, applies optional service flags, runs the smoke test and prints
final status. External smoke testing defaults to off; when it is off, the helper
reports the internal backend health check and explicitly marks the external test
as skipped. `RUN_SMOKE_TEST=true` requires every URL shown above and Compose
Nginx to be enabled. The helper never deletes volumes.

After certificates and the selected staging bot are verified, rerun with:

```bash
ENABLE_TELEGRAM_BOT=true ENABLE_NGINX=true RUN_SMOKE_TEST=true \
BACKEND_URL=https://API_DOMAIN \
PATIENT_WEB_URL=https://STAGING_DOMAIN \
DOCTOR_PANEL_URL=https://doctor.STAGING_DOMAIN \
ADMIN_PANEL_URL=https://admin.STAGING_DOMAIN \
CLINIC_OWNER_PANEL_URL=https://owner.STAGING_DOMAIN \
  ./scripts/deploy-staging.sh
```

Only one Telegram polling worker may use the staging bot token. Confirm the bot
is staging-only before enabling it.

## 9. Monitoring and status

```bash
./scripts/deploy-status.sh
docker compose --env-file .env.staging \
  -f docker-compose.staging.example.yml logs --tail=200 backend telegram-bot nginx
```

Monitor availability, certificate expiry, CPU/RAM/disk, container restarts,
PostgreSQL/Redis health and sanitized application errors. Logs must not contain
tokens, OTPs, passwords, authorization headers, patient data or request bodies.

## 10. Backup rehearsal

```bash
BACKUP_DIR=/srv/docnear/shared/backups RETENTION_DAYS=14 \
  ./scripts/backup-staging-postgres.sh
```

The helper creates a timestamped PostgreSQL custom-format dump with mode `0600`.
It does not auto-delete old backups. Copy dumps to encrypted off-host storage,
define retention with the data owner and regularly restore into a new isolated
staging database. Never rehearse restore against production.

## 11. Rollback rehearsal

Record an explicit reviewed target and confirm migration compatibility:

```bash
./scripts/rollback-staging.sh --commit FULL_GIT_COMMIT_SHA
# immutable registry alternative:
./scripts/rollback-staging.sh --image registry.example/docnear@sha256:IMAGE_DIGEST
```

The helper stops Nginx traffic, validates the environment, shows the migration
plan, checks the selected release, restarts services and runs health/smoke tests.
It records the pre-rollback running/stopped state of Nginx and the Telegram bot,
then restores both states automatically after success. If rollback fails after
traffic was stopped, it prints a prominent recovery message and attempts to
restore Nginx only when the backend state is safe. External smoke testing is
opt-in with `RUN_SMOKE_TEST=true` plus all five URL variables. It never runs
reverse/destructive SQL and never deletes Docker volumes.

## Client readiness audit

All four React clients accept a build-time `VITE_API_BASE_URL`:

- patient web: `DocNear-web-frontend-main(2)/DocNear-web-frontend-main`
- doctor panel: `DocNear-Doctor-panel-main(2)/DocNear-Doctor-panel-main`
- admin panel: `DocNear-admin-panel`
- clinic owner panel: `DocNear-clinic-owner-panel`

Each API client retains `http://127.0.0.1:8001/api/v1` only as a local
development fallback. Live browser integration tests also contain explicit
localhost URLs. Staging and production builds must always inject an HTTPS URL:

```bash
VITE_API_BASE_URL=https://API_DOMAIN/api/v1 npm run build
```

Flutter reads `API_BASE_URL` via `--dart-define` in
`DocNear-Mobile/lib/core/config/app_config.dart`. Release mode rejects non-HTTPS
API URLs; debug builds may use an emulator loopback endpoint. Build a release
with:

```bash
cd DocNear-Mobile
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://API_DOMAIN/api/v1/ \
  --dart-define=TELEGRAM_BOT_USERNAME=STAGING_BOT_USERNAME
```

No UI redesign or client source change is required for environment selection.
