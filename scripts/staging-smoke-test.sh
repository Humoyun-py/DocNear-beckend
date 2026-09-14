#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8001}"
PATIENT_WEB_URL="${PATIENT_WEB_URL:-http://127.0.0.1:3001}"
DOCTOR_PANEL_URL="${DOCTOR_PANEL_URL:-http://127.0.0.1:3002}"
ADMIN_PANEL_URL="${ADMIN_PANEL_URL:-http://127.0.0.1:3003}"
CLINIC_OWNER_PANEL_URL="${CLINIC_OWNER_PANEL_URL:-http://127.0.0.1:3004}"

check_url() {
  local name="$1" url="$2"
  local status
  status="$(curl --silent --show-error --location --output /dev/null --write-out '%{http_code}' "$url")"
  case "$status" in
    2*|3*) printf 'PASS %-16s %s (%s)\n' "$name" "$url" "$status" ;;
    *) printf 'FAIL %-16s %s (%s)\n' "$name" "$url" "$status" >&2; return 1 ;;
  esac
}

check_url "backend health" "${BACKEND_URL%/}/health/"
check_url "API docs" "${BACKEND_URL%/}/api/docs/"
check_url "patient web" "$PATIENT_WEB_URL"
check_url "doctor panel" "$DOCTOR_PANEL_URL"
check_url "admin panel" "$ADMIN_PANEL_URL"
check_url "clinic owner" "$CLINIC_OWNER_PANEL_URL"

cat <<'EOF'
Telegram: if the staging worker is running locally, inspect it without exposing
tokens or chat IDs:
  DOCNEAR_ENV_FILE=.env.staging python backend/manage.py telegram_status --settings=config.settings.production
  DOCNEAR_ENV_FILE=.env.staging python backend/manage.py telegram_links --settings=config.settings.production
EOF
