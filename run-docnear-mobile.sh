#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SDK_DIR="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/Android/Sdk}}"
ADB="$SDK_DIR/platform-tools/adb"
EMULATOR="$SDK_DIR/emulator/emulator"
AVD_NAME="${DOCNEAR_AVD:-Pixel_9_Pro_XL}"
EMULATOR_PORT="${DOCNEAR_EMULATOR_PORT:-5554}"
SERIAL="emulator-$EMULATOR_PORT"
APP_ID=com.docnear.app
FLUTTER_APP="$ROOT_DIR/DocNear-Mobile"
APK_OUTPUT="$FLUTTER_APP/build/app/outputs/flutter-apk/app-debug.apk"
API_BASE_URL="${API_BASE_URL:-http://10.0.2.2:8001/api/v1/}"
TELEGRAM_BOT_USERNAME="${TELEGRAM_BOT_USERNAME:-}"
if [[ -z "$TELEGRAM_BOT_USERNAME" && -n "${DOCNEAR_ENV_FILE:-}" && -r "$DOCNEAR_ENV_FILE" ]]; then
  TELEGRAM_BOT_USERNAME="$("$ROOT_DIR/.venv/bin/python" - "$DOCNEAR_ENV_FILE" <<'PY'
from dotenv import dotenv_values
import sys

print(dotenv_values(sys.argv[1]).get("TELEGRAM_BOT_USERNAME", ""))
PY
)"
fi

if [[ ! -x "$ADB" || ! -x "$EMULATOR" ]]; then
  echo "Android SDK topilmadi. ANDROID_SDK_ROOT ni sozlang." >&2
  exit 1
fi

timeout 15s "$ADB" start-server
DEVICE_STATE="$(timeout 10s "$ADB" -s "$SERIAL" get-state 2>/dev/null || true)"
if [[ "$DEVICE_STATE" != device ]]; then
  if timeout 10s "$ADB" devices | awk 'NR > 1 {print $1}' | grep -Fxq "$SERIAL"; then
    echo "Emulator offline. Emulator oynasini yoping, keyin scriptni qayta bajaring." >&2
    exit 1
  fi
  EMULATOR_LOG="$(mktemp /tmp/docnear-emulator.XXXXXX.log)"
  echo "Emulator ochilmoqda. Log: $EMULATOR_LOG"
  nohup "$EMULATOR" -avd "$AVD_NAME" -port "$EMULATOR_PORT" \
    -no-snapshot -gpu software -memory 3072 -cores 2 -no-boot-anim \
    >"$EMULATOR_LOG" 2>&1 </dev/null &
fi

echo "Android tizimi tayyor bo‘lishi kutilmoqda..."
DEADLINE=$((SECONDS + 180))
READY=false
while (( SECONDS < DEADLINE )); do
  BOOT="$(timeout 8s "$ADB" -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
  SERVICES="$(timeout 8s "$ADB" -s "$SERIAL" shell 'service check window; service check package' 2>/dev/null || true)"
  if [[ "$BOOT" == 1 && "$SERVICES" == *'Service window: found'* && "$SERVICES" == *'Service package: found'* ]]; then
    READY=true
    break
  fi
  sleep 3
done
if [[ "$READY" != true ]]; then
  echo "Android xizmatlari tayyor bo‘lmadi. Emulatorni yoping va scriptni qayta bajaring." >&2
  exit 1
fi

# Reduce the high-resolution Pixel display's memory use. Restore with wm size/density reset.
timeout 15s "$ADB" -s "$SERIAL" shell wm size 720x1600
timeout 15s "$ADB" -s "$SERIAL" shell wm density 320
echo "Flutter debug APK joriy API va Telegram konfiguratsiyasi bilan build qilinmoqda..."
(cd "$FLUTTER_APP" && flutter build apk --debug \
  --dart-define="API_BASE_URL=$API_BASE_URL" \
  --dart-define="TELEGRAM_BOT_USERNAME=$TELEGRAM_BOT_USERNAME")
timeout 240s "$ADB" -s "$SERIAL" install --no-streaming -r "$APK_OUTPUT"
timeout 10s "$ADB" -s "$SERIAL" shell input keyevent KEYCODE_WAKEUP
timeout 10s "$ADB" -s "$SERIAL" shell wm dismiss-keyguard
timeout 20s "$ADB" -s "$SERIAL" shell am start -n "$APP_ID/.MainActivity"
sleep 5
APP_PID="$(timeout 10s "$ADB" -s "$SERIAL" shell pidof "$APP_ID" 2>/dev/null | tr -d '\r' || true)"
if [[ -z "$APP_PID" ]]; then
  echo "DocNear jarayoni ishga tushmadi. Android logcatni tekshiring." >&2
  exit 1
fi
CRASH="$(timeout 10s "$ADB" -s "$SERIAL" logcat -d -t 200 2>/dev/null | grep -E 'FATAL EXCEPTION|Process: com\.docnear\.app' || true)"
if [[ -n "$CRASH" ]]; then
  echo "$CRASH" >&2
  exit 1
fi
echo "DocNear Flutter ishga tushdi (PID $APP_PID). Emulator oynasini tekshiring."
