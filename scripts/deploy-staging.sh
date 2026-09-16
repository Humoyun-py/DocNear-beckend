#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.staging}"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/docker-compose.staging.example.yml}"
ENABLE_TELEGRAM_BOT="${ENABLE_TELEGRAM_BOT:-false}"
ENABLE_NGINX="${ENABLE_NGINX:-false}"
RUN_SMOKE_TEST="${RUN_SMOKE_TEST:-false}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

is_true() { [[ "${1,,}" =~ ^(1|true|yes|on)$ ]]; }
require_smoke_urls() {
  local name missing=0
  for name in BACKEND_URL PATIENT_WEB_URL DOCTOR_PANEL_URL ADMIN_PANEL_URL CLINIC_OWNER_PANEL_URL; do
    if [[ -z "${!name:-}" ]]; then
      echo "ERROR: $name is required when RUN_SMOKE_TEST=true." >&2
      missing=1
    fi
  done
  (( missing == 0 ))
}
wait_healthy() {
  local service="$1" deadline=$((SECONDS + HEALTH_TIMEOUT)) container status
  while (( SECONDS < deadline )); do
    container="$("${COMPOSE[@]}" ps -q "$service")"
    if [[ -n "$container" ]]; then
      status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container")"
      if [[ "$status" == "healthy" ]]; then echo "$service is healthy."; return 0; fi
      if [[ "$status" == "exited" || "$status" == "dead" || "$status" == "unhealthy" ]]; then
        echo "ERROR: $service entered state $status." >&2
        "${COMPOSE[@]}" logs --tail=80 "$service" >&2
        return 1
      fi
    fi
    sleep 3
  done
  echo "ERROR: timed out waiting for $service health." >&2
  return 1
}

cd "$REPO_ROOT"
echo "[1/15] Running server preflight..."
"$SCRIPT_DIR/server-preflight.sh" "$ENV_FILE" "$COMPOSE_FILE"
echo "[2/15] Validating staging environment..."
"$SCRIPT_DIR/validate-deploy-env.py" "$ENV_FILE"
echo "[3/15] Validating Compose configuration..."
"${COMPOSE[@]}" config --quiet
echo "[4/15] Building application images..."
"${COMPOSE[@]}" build backend telegram-bot
echo "[5/15] Starting PostgreSQL and Redis..."
"${COMPOSE[@]}" up -d postgres redis
echo "[6/15] Waiting for data services..."
wait_healthy postgres
wait_healthy redis
echo "[7/15] Running Django deployment checks..."
"${COMPOSE[@]}" run --rm --no-deps backend python manage.py check --deploy --settings=config.settings.production
echo "[8/15] Applying forward migrations..."
"${COMPOSE[@]}" run --rm --no-deps backend python manage.py migrate --noinput --settings=config.settings.production
echo "[9/15] Collecting static files..."
"${COMPOSE[@]}" run --rm --no-deps backend python manage.py collectstatic --noinput --settings=config.settings.production
echo "[10/15] Starting backend..."
"${COMPOSE[@]}" up -d --no-deps backend
echo "[11/15] Waiting for backend health..."
wait_healthy backend
echo "[12/15] Telegram worker selection..."
if is_true "$ENABLE_TELEGRAM_BOT"; then
  "${COMPOSE[@]}" up -d --no-deps telegram-bot
else
  "${COMPOSE[@]}" stop telegram-bot >/dev/null 2>&1 || true
  echo "Telegram worker disabled; set ENABLE_TELEGRAM_BOT=true to start it."
fi
echo "[13/15] Nginx selection..."
if is_true "$ENABLE_NGINX"; then
  "${COMPOSE[@]}" up -d --no-deps nginx
else
  "${COMPOSE[@]}" stop nginx >/dev/null 2>&1 || true
  echo "Nginx disabled; set ENABLE_NGINX=true after DNS/certificates are ready."
fi
echo "[14/15] Smoke-test selection..."
if is_true "$RUN_SMOKE_TEST"; then
  require_smoke_urls
  if ! is_true "$ENABLE_NGINX"; then
    echo "ERROR: external smoke testing was requested while Compose Nginx is disabled." >&2
    echo "The backend passed its internal container health check, but no external smoke test was run." >&2
    exit 1
  fi
  "$SCRIPT_DIR/staging-smoke-test.sh"
  echo "External staging smoke test passed."
else
  echo "External staging smoke test skipped (RUN_SMOKE_TEST=false)."
  echo "Internal backend container health check passed; this is not an external smoke-test pass."
fi
echo "[15/15] Final service status:"
"${COMPOSE[@]}" ps
