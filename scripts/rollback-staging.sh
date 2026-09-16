#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.staging}"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/docker-compose.staging.example.yml}"
RUN_SMOKE_TEST="${RUN_SMOKE_TEST:-false}"
TARGET_COMMIT=""
TARGET_IMAGE=""

usage() {
  echo "Usage: $0 (--commit FULL_GIT_COMMIT | --image IMMUTABLE_IMAGE_REFERENCE)" >&2
  exit 2
}
while (( $# )); do
  case "$1" in
    --commit) [[ $# -ge 2 ]] || usage; TARGET_COMMIT="$2"; shift 2 ;;
    --image) [[ $# -ge 2 ]] || usage; TARGET_IMAGE="$2"; shift 2 ;;
    *) usage ;;
  esac
done
[[ -n "$TARGET_COMMIT" && -z "$TARGET_IMAGE" ]] || [[ -n "$TARGET_IMAGE" && -z "$TARGET_COMMIT" ]] || usage

cd "$REPO_ROOT"
"$SCRIPT_DIR/server-preflight.sh" "$ENV_FILE" "$COMPOSE_FILE"
"$SCRIPT_DIR/validate-deploy-env.py" "$ENV_FILE"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

is_true() { [[ "${1,,}" =~ ^(1|true|yes|on)$ ]]; }
service_is_running() {
  local container
  container="$("${COMPOSE[@]}" ps -q "$1" 2>/dev/null || true)"
  [[ -n "$container" ]] && [[ "$(docker inspect --format '{{.State.Running}}' "$container" 2>/dev/null || true)" == "true" ]]
}
restore_service_state() {
  local service="$1" was_running="$2"
  if [[ "$was_running" == "true" ]]; then
    "${COMPOSE[@]}" up -d --no-deps "$service"
  else
    "${COMPOSE[@]}" stop "$service" >/dev/null 2>&1 || true
  fi
}
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

resolved=""
if [[ -n "$TARGET_COMMIT" ]]; then
  [[ -z "$(git status --porcelain)" ]] || { echo "ERROR: working tree must be clean for commit rollback." >&2; exit 1; }
  resolved="$(git rev-parse --verify "${TARGET_COMMIT}^{commit}")"
  [[ "$TARGET_COMMIT" == "$resolved" ]] || { echo "ERROR: provide the full resolved commit SHA." >&2; exit 1; }
else
  [[ "$TARGET_IMAGE" != *:latest && "$TARGET_IMAGE" == *@sha256:* ]] || {
    echo "ERROR: image rollback requires an immutable @sha256 digest and must not use :latest." >&2
    exit 1
  }
  docker pull "$TARGET_IMAGE"
fi

nginx_was_running=false
telegram_was_running=false
service_is_running nginx && nginx_was_running=true
service_is_running telegram-bot && telegram_was_running=true
echo "Recorded pre-rollback service state: nginx=$nginx_was_running, telegram-bot=$telegram_was_running."

if [[ "$nginx_was_running" == "true" ]]; then
  echo "Stopping Nginx to remove application traffic..."
  "${COMPOSE[@]}" stop nginx
else
  echo "Nginx was already stopped; leaving traffic disabled."
fi

override_file=""
backend_replaced=false
backend_healthy=false
services_restored=false
on_exit() {
  local exit_code=$?
  if (( exit_code != 0 )) && [[ "$nginx_was_running" == "true" ]] && [[ "$services_restored" != "true" ]]; then
    echo "" >&2
    echo "==================== ROLLBACK RECOVERY REQUIRED ====================" >&2
    echo "Rollback failed after Nginx traffic was stopped." >&2
    if [[ "$backend_replaced" != "true" || "$backend_healthy" == "true" ]]; then
      echo "Attempting to restore the previously running Nginx service..." >&2
      if restore_service_state nginx true; then
        echo "Nginx was restored. Verify the public health endpoint immediately." >&2
      else
        echo "Automatic Nginx restoration failed. Restore it manually after verifying backend health." >&2
      fi
    else
      echo "Nginx was not restarted because the replacement backend is not healthy." >&2
      echo "Recover a healthy backend, then run: docker compose ... up -d --no-deps nginx" >&2
    fi
    echo "No volumes, migrations, or database contents were deleted or reversed." >&2
    echo "====================================================================" >&2
  fi
  [[ -z "$override_file" ]] || rm -f -- "$override_file"
  return "$exit_code"
}
trap on_exit EXIT
if [[ -n "$TARGET_COMMIT" ]]; then
  echo "Selecting rollback commit $resolved (detached HEAD)..."
  git switch --detach "$resolved"
  "${COMPOSE[@]}" build backend telegram-bot
else
  override_file="$(mktemp)"
  chmod 600 "$override_file"
  printf 'services:\n  backend:\n    image: "%s"\n  telegram-bot:\n    image: "%s"\n' "$TARGET_IMAGE" "$TARGET_IMAGE" >"$override_file"
  COMPOSE+=( -f "$override_file" )
fi

"${COMPOSE[@]}" config --quiet
echo "Checking migration plan. Review this output for backward-incompatible schema changes."
"${COMPOSE[@]}" run --rm --no-deps backend python manage.py showmigrations --plan --settings=config.settings.production
echo "No reverse migrations or destructive SQL will be run."
"${COMPOSE[@]}" run --rm --no-deps backend python manage.py check --deploy --settings=config.settings.production
backend_replaced=true
"${COMPOSE[@]}" up -d --no-deps backend

deadline=$((SECONDS + 180))
while (( SECONDS < deadline )); do
  container="$("${COMPOSE[@]}" ps -q backend)"
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || true)"
  [[ "$status" == "healthy" ]] && break
  [[ "$status" == "unhealthy" || "$status" == "exited" ]] && { echo "ERROR: backend rollback health failed." >&2; exit 1; }
  sleep 3
done
[[ "${status:-}" == "healthy" ]] || { echo "ERROR: backend health timeout." >&2; exit 1; }
backend_healthy=true

echo "Restoring pre-rollback service states..."
restore_service_state telegram-bot "$telegram_was_running"
restore_service_state nginx "$nginx_was_running"
services_restored=true

if is_true "$RUN_SMOKE_TEST"; then
  require_smoke_urls
  if [[ "$nginx_was_running" != "true" ]]; then
    echo "ERROR: external smoke testing was requested, but Nginx was stopped before rollback and remains stopped." >&2
    echo "Backend internal health passed; external smoke testing was not executed." >&2
    exit 1
  fi
  "$SCRIPT_DIR/staging-smoke-test.sh"
  echo "External rollback smoke test passed."
else
  echo "External smoke test skipped (RUN_SMOKE_TEST=false)."
  echo "Backend internal health passed; this is not an external smoke-test pass."
fi
"${COMPOSE[@]}" ps
echo "Rollback health checks passed and prior service states were restored."
echo "Volumes and database contents were not deleted or reversed."
