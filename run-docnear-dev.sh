#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PYTHON="$ROOT_DIR/.venv/bin/python"
BACKEND_PORT="${BACKEND_PORT:-8001}"
WEB_PORT="${WEB_PORT:-3001}"
DOCTOR_PORT="${DOCTOR_PORT:-3002}"
ADMIN_PORT="${ADMIN_PORT:-3003}"
OWNER_PORT="${OWNER_PORT:-3004}"
if [[ ! -x "$PYTHON" ]]; then echo "Python virtualenv topilmadi: $ROOT_DIR/.venv" >&2; exit 1; fi
if [[ -z "${DOCNEAR_ENV_FILE:-}" && -r "$HOME/docnear-env-backup/repo-root.env" ]]; then
  export DOCNEAR_ENV_FILE="$HOME/docnear-env-backup/repo-root.env"
fi
if [[ -n "${DOCNEAR_ENV_FILE:-}" && "$DOCNEAR_ENV_FILE" != /* ]]; then
  export DOCNEAR_ENV_FILE="$ROOT_DIR/${DOCNEAR_ENV_FILE#./}"
fi
if [[ -n "${DOCNEAR_ENV_FILE:-}" && ! -r "$DOCNEAR_ENV_FILE" ]]; then
  echo "DOCNEAR_ENV_FILE o‘qib bo‘lmaydi: $DOCNEAR_ENV_FILE" >&2
  exit 1
fi
if [[ -z "${DATABASE_URL:-}" && -z "${DOCNEAR_ENV_FILE:-}" ]]; then
  echo "DATABASE_URL yoki tashqi DOCNEAR_ENV_FILE ni sozlang." >&2
  exit 1
fi
if [[ -z "${VITE_TELEGRAM_BOT_USERNAME:-}" ]]; then
  if [[ -n "${TELEGRAM_BOT_USERNAME:-}" ]]; then
    export VITE_TELEGRAM_BOT_USERNAME="$TELEGRAM_BOT_USERNAME"
  elif [[ -n "${DOCNEAR_ENV_FILE:-}" ]]; then
    VITE_TELEGRAM_BOT_USERNAME="$("$PYTHON" - "$DOCNEAR_ENV_FILE" <<'PY'
from dotenv import dotenv_values
import sys

print(dotenv_values(sys.argv[1]).get("TELEGRAM_BOT_USERNAME", ""))
PY
)"
    export VITE_TELEGRAM_BOT_USERNAME
  fi
fi
"$PYTHON" - "$BACKEND_PORT" "$WEB_PORT" "$DOCTOR_PORT" "$ADMIN_PORT" "$OWNER_PORT" <<'PY'
import socket, sys
for port in sys.argv[1:]:
    with socket.socket() as sock:
        try: sock.bind(("0.0.0.0", int(port)))
        except OSError:
            raise SystemExit(f"{port} port band. Shu portdagi oldingi dev server terminalida Ctrl+C bosing.")
PY
export DEBUG=true DJANGO_SETTINGS_MODULE=config.settings.development
export CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-http://localhost:$WEB_PORT,http://127.0.0.1:$WEB_PORT,http://localhost:$DOCTOR_PORT,http://127.0.0.1:$DOCTOR_PORT,http://localhost:$ADMIN_PORT,http://127.0.0.1:$ADMIN_PORT,http://localhost:$OWNER_PORT,http://127.0.0.1:$OWNER_PORT}"
export VITE_API_BASE_URL="http://127.0.0.1:$BACKEND_PORT/api/v1"
(cd "$ROOT_DIR/backend" && "$PYTHON" manage.py migrate --noinput)
PIDS=()
cleanup() { for pid in "${PIDS[@]}"; do kill -- "-$pid" 2>/dev/null || true; done; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
(cd "$ROOT_DIR/backend" && exec setsid "$PYTHON" manage.py runserver "0.0.0.0:$BACKEND_PORT" --noreload) &
PIDS+=("$!")
(cd "$ROOT_DIR/DocNear-web-frontend-main(2)/DocNear-web-frontend-main" && exec setsid env PORT="$WEB_PORT" npm run dev) &
PIDS+=("$!")
(cd "$ROOT_DIR/DocNear-Doctor-panel-main(2)/DocNear-Doctor-panel-main" && exec setsid npm run dev -- --port "$DOCTOR_PORT" --strictPort) &
PIDS+=("$!")
(cd "$ROOT_DIR/DocNear-admin-panel" && exec setsid npm run dev -- --port "$ADMIN_PORT" --strictPort) &
PIDS+=("$!")
(cd "$ROOT_DIR/DocNear-clinic-owner-panel" && exec setsid npm run dev -- --port "$OWNER_PORT" --strictPort) &
PIDS+=("$!")
echo "API: http://127.0.0.1:$BACKEND_PORT"
echo "Patient web: http://localhost:$WEB_PORT"
echo "Doctor panel: http://localhost:$DOCTOR_PORT"
echo "Admin panel: http://localhost:$ADMIN_PORT"
echo "Clinic owner: http://localhost:$OWNER_PORT"
wait -n "${PIDS[@]}"
