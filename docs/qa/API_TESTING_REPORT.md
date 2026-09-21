# DocNear API testing report

Test date: 2026-09-12 (Asia/Tashkent).

## Result

- Django check: passed.
- Python compilation: passed.
- Ruff: passed.
- PostgreSQL migration application: passed.
- Migration drift check: no changes detected.
- Pytest: **2345 passed**, zero failed.
- Live Newman acceptance: **24 requests and 59 assertions passed**, zero failed.
- Playwright patient/doctor booking flow: passed with zero browser errors;
  phone-only login/register controls and six-digit numeric OTP input verified.
- Playwright admin/owner/Telegram ecosystem flow: passed with zero browser
  errors, including a fresh phone OTP registration.
- Live Flutter repository flow: **1 passed**, zero failed.
- Production deploy check: passed with zero issues after the OpenAPI enum fix.

## Exercised live flow

The live PostgreSQL/Django flow requested and verified phone OTP for patient,
patient B, doctor, clinic owner, admin, and super-admin accounts. It loaded the
nearby QA clinic, selected its doctor, loaded real availability, created a
booking, and captured the generated Booking ID.

The doctor API saw and accepted the pending booking. Patient, admin, clinic
owner, and super-admin APIs then returned the same Booking ID with `confirmed`
status. Patient B's attempt to reserve the same slot returned HTTP 409 and
`slot_unavailable`. Cleanup cancelled the fictional QA appointment.

## Coverage

The backend suite covers phone OTP registration/login, hashed and expiring OTPs,
request and attempt limits, JWT refresh rotation, role and object permissions,
public clinic/doctor discovery, schedules and availability,
appointments and transitions, PostgreSQL overlap protection, favorites,
reviews, notifications, all three management panels, waitlists, response
envelopes, sanitized error handling, Telegram linking/booking, OpenAPI, and
Postman inventory consistency.

Double-booking and permission tests remain enabled. Tests use PostgreSQL rather
than SQLite.

Telegram bot tests cover safe `getMe` diagnostics, webhook cleanup,
missing-token behavior, the `/start` contact keyboard, own and foreign contacts,
automatic login/register OTP selection, legacy commands, `/unlink`, disabled
delivery, and protection against OTP or token disclosure through output and
chained transport errors.

All five auth clients now normalize Uzbek phone input before sending it, keep
the last delivery channel for resend, disable resend for 60 seconds, and state
that only the latest code remains valid. The isolated QA runner raises only its
test-local OTP request ceilings so the sequential Newman and Playwright suites
can share one fixture database without bypassing production limits.

## Security observations

- Unknown phone login requests use the same generic response and remain rate
  limited by phone and IP.
- OTP values are hashed, expire after five minutes, and are never written to
  application logs.
- Production settings require an explicit long secret, database URL, allowed
  hosts, HTTPS-only CORS origins, an HTTP SMS provider, and runtime SMS and
  Telegram credentials.
- Telegram phone linking validates that the shared contact belongs to the
  sender; Telegram OTP requires an active phone link.
- Booking ID alone does not grant Telegram appointment access.
- The QA helper uses an ignored private runtime directory and does not print
  tokens or OTP values.

## Evidence and reproduction

- Newman JUnit: `docs/qa/newman-results.xml`
- Flutter live log: `.runtime/integration/flutter-live-integration.log`
- Endpoint inventory: `docs/qa/API_ENDPOINTS.md`
- Permission matrix: `docs/qa/PERMISSION_MATRIX.md`

Use `scripts/run-integration-qa.sh` for the isolated live server, then run only
the Postman folder `00 End-to-end booking verification`. The runner now defaults
to `http://127.0.0.1:8001`, matching the repository's local environment.

This is strong MVP acceptance evidence, not a production penetration test or a
substitute for staging provider, load, backup/restore, and device testing.
