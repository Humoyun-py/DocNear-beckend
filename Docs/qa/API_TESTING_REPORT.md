# DocNear API testing report

Test date: 2026-09-11 (Asia/Tashkent).

## Result

- Django check: passed.
- Python compilation: passed.
- Ruff: passed.
- PostgreSQL migration application: passed.
- Migration drift check: no changes detected.
- Pytest: **2243 passed**, zero failed.
- Live Newman acceptance: **18 requests and 47 assertions passed**, zero failed.
- Live Flutter repository flow: **1 passed**, zero failed.
- Production deploy check: passed with zero issues after the OpenAPI enum fix.

## Exercised live flow

The live PostgreSQL/Django flow logged in patient, patient B, doctor, clinic
owner, admin, and super-admin accounts. It loaded the nearby QA clinic, selected
its doctor, loaded real availability, created a booking, and captured the
generated Booking ID.

The doctor API saw and accepted the pending booking. Patient, admin, clinic
owner, and super-admin APIs then returned the same Booking ID with `confirmed`
status. Patient B's attempt to reserve the same slot returned HTTP 409 and
`slot_unavailable`. Cleanup cancelled the fictional QA appointment.

## Coverage

The backend suite covers authentication and refresh rotation, role and object
permissions, public clinic/doctor discovery, schedules and availability,
appointments and transitions, PostgreSQL overlap protection, favorites,
reviews, notifications, all three management panels, waitlists, response
envelopes, sanitized error handling, Telegram linking/booking, OpenAPI, and
Postman inventory consistency.

Double-booking and permission tests remain enabled. Tests use PostgreSQL rather
than SQLite.

## Security observations

- Password reset does not disclose whether an account exists.
- Production settings require an explicit long secret, database URL, allowed
  hosts, and HTTPS-only CORS origins.
- Telegram private actions require a runtime bot secret and linked patient.
- Booking ID alone does not grant Telegram appointment access.
- The QA helper uses an ignored private runtime directory and does not print
  tokens or passwords.

## Evidence and reproduction

- Newman JUnit: `Docs/qa/newman-results.xml`
- Flutter live log: `.runtime/integration/flutter-live-integration.log`
- Endpoint inventory: `Docs/qa/API_ENDPOINTS.md`
- Permission matrix: `Docs/qa/PERMISSION_MATRIX.md`

Use `scripts/run-integration-qa.sh` for the isolated live server, then run only
the Postman folder `00 End-to-end booking verification`. The runner now defaults
to `http://127.0.0.1:8001`, matching the repository's local environment.

This is strong MVP acceptance evidence, not a production penetration test or a
substitute for staging provider, load, backup/restore, and device testing.
