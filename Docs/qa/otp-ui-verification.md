# OTP UI verification — 2026-09-13

Flutter keeps the router and OTP form alive after a failed verification or a
settings change. Initial send and resend actions respect HTTP 429 and prevent
overlapping requests. Resending clears the old code. Web clients preserve the
structured API error, support pasting spaced codes, and require an explicit
phone-change action after delivery. Empty validation objects no longer appear
in error messages.

Verification performed for this change:

- Flutter analyze: no issues.
- Flutter tests: 14 passed, 1 live-backend test skipped in this run.
- Patient, doctor, admin and owner: lint and production build passed.
- `node tests/otp-ui.mjs` from the patient web directory: all four clients passed.
  OTP responses are intercepted for these UI regressions; no real messages are sent.
- Telegram diagnostics and QA bootstrap: 15 pytest tests passed.
- Ruff and `git diff --check`: passed.
- Fresh debug APK installed on emulator-5554; Android reported `Status: ok`.
  Onboarding and phone-login screens were visually verified.

Debug APK: `artifacts/DocNear-debug.apk` (ignored by Git).

SHA-256: `fb6db45c5b1ae44d22d170b9ce3e0b225aeb3fe0a34504eb2073eb8af077c6af`

Built with emulator API `http://10.0.2.2:8001/api/v1/` and bot username
`Clinic_Booking_System_bot`. A physical phone needs a reachable backend address
and a corresponding build. This is a development APK, not a production release.

API contract documentation now reflects supported methods and Telegram headers.
Diagnostics distinguish failed webhook lookup from failed getMe, and exhausted
OTPs from active ones. The isolated QA launcher safely creates its missing secret
on first run with mode 0600, without printing it.

Real Telegram message delivery, production SMS delivery and the full booking E2E
were not rerun in this verification pass. The runtime env was retained and remains
ignored; APK/build outputs and local Android properties remain ignored.
