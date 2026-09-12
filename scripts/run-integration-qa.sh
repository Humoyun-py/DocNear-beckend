#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
QA_DIR="$ROOT/.runtime/integration"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
PG_STARTED=false
cleanup() {
  if [[ "$PG_STARTED" == true ]]; then
    "$PG_BIN/pg_ctl" -D "$QA_DIR/pg" stop -m fast >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
mkdir -p "$QA_DIR"
chmod 700 "$QA_DIR"
if [[ ! -f "$QA_DIR/pg/PG_VERSION" ]]; then
  "$PG_BIN/initdb" -D "$QA_DIR/pg" -A trust --no-locale --encoding=UTF8 > "$QA_DIR/initdb.log"
fi
if ! "$PG_BIN/pg_ctl" -D "$QA_DIR/pg" status >/dev/null 2>&1; then
  "$PG_BIN/pg_ctl" -D "$QA_DIR/pg" -l "$QA_DIR/postgres.log" -o "-p 55439 -k $QA_DIR -c listen_addresses=''" start
  PG_STARTED=true
fi
if ! "$PG_BIN/psql" -h "$QA_DIR" -p 55439 -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname='docnear_integration_qa'" | grep -qx 1; then
  "$PG_BIN/createdb" -h "$QA_DIR" -p 55439 docnear_integration_qa
fi
export DATABASE_URL="postgresql:///docnear_integration_qa?host=$QA_DIR&port=55439"
export DEBUG=true DJANGO_SETTINGS_MODULE=config.settings.test DOCNEAR_QA_LIVE=1
export OTP_SMS_PROVIDER=console OTP_TEST_CODE=111111 OTP_REQUEST_RATE=100/min OTP_VERIFY_RATE=100/min
export DOCNEAR_QA_RUNTIME_DIR="$QA_DIR"
export DOCNEAR_QA_BASE_URL="${DOCNEAR_QA_BASE_URL:-http://127.0.0.1:8001}"
export TELEGRAM_BOT_SECRET="$(cat "$QA_DIR/telegram-secret")"
export CORS_ALLOWED_ORIGINS="http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://127.0.0.1:3001,http://127.0.0.1:3002,http://127.0.0.1:3003,http://127.0.0.1:3004"
cd "$ROOT/backend"
"$ROOT/.venv/bin/python" -m qa.prepare_live
"$ROOT/.venv/bin/python" manage.py runserver 0.0.0.0:8001 --noreload
