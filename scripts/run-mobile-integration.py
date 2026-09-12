"""Run Flutter repositories against the isolated DocNear Django QA API."""

import json
from pathlib import Path
import subprocess


root = Path(__file__).resolve().parents[1]
runtime = root / ".runtime/integration"
values = {
    item["key"]: item["value"]
    for item in json.loads((runtime / "postman.env.json").read_text())["values"]
}
otp_code = values["otp_test_code"]
command = [
    "flutter",
    "test",
    "test/live_backend_test.dart",
    "--dart-define=LIVE_API=true",
    "--dart-define=API_BASE_URL=http://127.0.0.1:8001/api/v1/",
    f"--dart-define=QA_OTP_CODE={otp_code}",
]
result = subprocess.run(
    command,
    cwd=root / "DocNear-Mobile",
    capture_output=True,
    text=True,
    timeout=240,
)
output = (result.stdout + result.stderr).replace(otp_code, "[REDACTED]")
(runtime / "flutter-live-integration.log").write_text(output)
print(output)
if result.returncode:
    raise SystemExit(result.returncode)
