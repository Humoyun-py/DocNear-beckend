# DocNear repository audit

Audit date: 2026-09-11 (Asia/Tashkent).

## Repository status

- Remote: `https://github.com/Humoyun-py/DocNear-beckend.git`
- Default working branch: `main`
- Latest checked commit: `ec3718942f6a1776b07a550df98a4ee44e3864b0`
  (`Complete repository audit, CI and production preparation`)
- The integration, CI, security, dependency, documentation, and cleanup changes
  described here are represented by that commit. The later local `.env` backup
  and removal is documented below.

Active product modules:

- `backend/`: Django REST Framework, PostgreSQL, JWT, role APIs, Telegram APIs.
- `DocNear-Mobile/`: the only active mobile app, built with Flutter.
- `DocNear-web-frontend-main(2)/DocNear-web-frontend-main/`: patient React app.
- `DocNear-Doctor-panel-main(2)/DocNear-Doctor-panel-main/`: doctor React panel.
- `DocNear-admin-panel/`: administrator React panel.
- `DocNear-clinic-owner-panel/`: clinic owner React panel.
- `postman/`: generated API inventory and executable acceptance flow.
- `scripts/`: backend/API/mobile integration runners.
- `Docs/`: contracts, runbooks, QA evidence, security and deployment guidance.

The retired Kotlin mobile project has been removed. No launcher or build script
references it.

## Verified results

### Backend

- Django development check: passed with zero issues.
- Python compilation: passed.
- Ruff: passed.
- PostgreSQL 16 migrations: all applied successfully.
- Migration drift check: `No changes detected`.
- Pytest: **2243 passed in 108.94 seconds** against an isolated PostgreSQL
  cluster; double-booking and permission tests were retained.
- Production deploy check: passed with zero issues using non-secret QA values.
- Password reset returns the same response whether an active account exists.
- Production errors and failed health checks have sanitized response tests.

### Flutter mobile

- `flutter pub get`: passed.
- `flutter analyze`: passed with `No issues found`.
- Normal tests: **8 passed**, one opt-in live test skipped as designed.
- Debug APK build: passed from a clean Flutter build.
- Live Django test: **1 passed**. It verified patient login, clinics, doctors,
  availability, appointment creation, Booking ID, My Appointments, a 409
  `slot_unavailable` response for patient B, and cancellation cleanup.
- Package ID: `com.docnear.app`.
- API URL comes from `API_BASE_URL` through `dart-define`.
- JWT values use Flutter Secure Storage; refresh requests are synchronized and
  failed refresh clears the session.
- The map does not initialize when Maps is unconfigured. A clear setup message
  and clinic list remain available.

### React clients

- Patient web: clean `npm ci`, TypeScript lint, API-client test, and production build
  passed.
- Doctor panel: clean `npm ci`, TypeScript lint, and production build passed.
- Admin panel: clean `npm ci`, TypeScript lint, and production build passed.
- Clinic owner panel: clean `npm ci`, TypeScript lint, and production build
  passed.
- `npm audit`: zero known vulnerabilities in all four final lockfiles.
- Every API client unwraps `success/data`; list helpers consume `data.results`
  and follow pagination.
- Appointment mutations call backend repositories/services. Three unused files
  containing old fake records were removed.

### Shared live booking flow

Newman executed **18 HTTP requests and 47 assertions with zero failures**:

1. Patient, patient B, doctor, owner, admin, and super-admin JWT login.
2. Nearby clinic and its doctor loaded.
3. Real availability supplied a free slot.
4. Patient created an appointment and received a Booking ID.
5. Doctor saw the pending record and accepted it.
6. Patient, admin, clinic owner, and super-admin saw the same confirmed record.
7. Patient B received HTTP 409 for the occupied slot.
8. Cleanup cancelled the fictional QA appointment.

The JUnit evidence is `Docs/qa/newman-results.xml`. The QA environment stays in
ignored `.runtime/` storage and does not print credentials.

### Telegram

- Telegram booking inherits the patient appointment viewset and uses the same
  `Appointment` model and PostgreSQL database.
- Search, nearby clinics, availability, create/list/reschedule/cancel, and
  Booking ID lookup routes exist.
- Private routes require both a runtime bot secret and a linked patient.
- Tests cover cross-platform visibility and prevent Booking ID ownership bypass.
- No Telegram master code or source-level token is present.

### UI and repository hygiene

- A Unicode scan found no emoji characters in Flutter or React UI source.
- Flutter uses Lucide/Material icons; React clients use Lucide React.
- No high-confidence private key, Google key, OpenAI key, GitHub token, or Slack
  token pattern was found in the current tree or the two reachable Git commits.
- Real `.env`, keystore, APK/AAB, dependency, build, IDE, cache, and runtime
  paths are ignored by Git.
- The two local `.env` files were backed up as `repo-root.env` and
  `patient-web.env` under `/home/humoyun/docnear-env-backup/`, then removed from
  this workspace. The backup directory uses mode `700`, its files use mode
  `600`, and no real `.env` file is tracked or included in an artifact.
- Generated dependency/build directories are local only and are not tracked.

## Fixes made during this audit

- Added `.github/workflows/ci.yml` with PostgreSQL-backed backend checks, all
  React checks, and Flutter analysis/tests/APK build.
- Added migration verification to CI.
- Fixed the QA environment's stale port 8000; the local ecosystem uses 8001.
- Added automatic QA PostgreSQL cleanup to the integration runner.
- Resolved the OpenAPI appointment/waitlist status enum collision.
- Required explicit HTTPS CORS origins in production settings.
- Added secure cookie/referrer production settings.
- Added compatible `qs 6.16.0` overrides to remove Express transitive
  vulnerabilities without a risky Express major upgrade.
- Removed unused mock clinic/doctor/review/appointment datasets.
- Added a safe Google Maps missing-key state.
- Added a sanitized root `.env.example` and deployment documentation.

## MVP demo readiness

The code and automated acceptance flow are ready for an MVP demo. Before the
demo operator must:

- start PostgreSQL and point `DOCNEAR_ENV_FILE` to a protected configuration
  file stored outside the repository;
- run `./run-docnear-dev.sh`;
- add a restricted Google Maps key and enable Maps if the demo includes map
  tiles;
- open the four browser clients and Flutter emulator for a short visual/manual
  smoke test on the target display;
- push the branch and confirm the newly added GitHub Actions workflow passes in
  GitHub's runner environment.

## Production blockers and risks

The repository is not production-deployed or production-certified. These items
remain external configuration or environment work:

- final HTTPS API and client domains, DNS, reverse proxy, and certificates;
- secret-manager values for Django, PostgreSQL, Telegram, email, and storage;
- a restricted production CORS origin list and trusted proxy decision;
- managed PostgreSQL backups, monitoring, log retention, and restore testing;
- production email delivery and S3-compatible media storage verification;
- Android owner-controlled upload keystore and restricted Maps key;
- iOS archive, signing, Maps key, and device test on macOS/Xcode;
- deployed Telegram bot/webhook, Redis/Celery delivery, and provider smoke tests;
- manual accessibility and browser/device coverage beyond automated source and
  build checks;
- dependency and application security monitoring after deployment.

The known historical Telegram/Gemini credential warning remains in
`Docs/security/SECRETS.md`. If those values were ever active, rotate them before
deployment even though no current high-confidence secret pattern was found.
