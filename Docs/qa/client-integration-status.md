# Client integration status

Verified on 2026-09-11:

- Flutter, patient web, doctor panel, admin panel, and clinic owner panel source
  are present in this checkout.
- Every client defaults to `/api/v1` and supports an environment-provided API
  base URL.
- Django exposes both compatibility `/api/` routes and active `/api/v1/`
  routes.
- All clients unwrap the `success/data` envelope and paginated `data.results`.
- Flutter uses secure JWT storage and synchronized refresh/retry handling.
- React clients use session storage and synchronized refresh/retry handling.
- Patient booking, cancellation, and reschedule call the backend.
- Doctor acceptance calls the backend.
- Admin and clinic owner appointment lists use the backend's shared records.
- Unused fake appointment datasets were removed.
- Patient web lint, API-client test, and production build passed.
- Doctor, admin, and clinic owner lint/builds passed.
- All four final NPM lockfiles report zero known vulnerabilities.
- Flutter analysis, 8 normal tests, debug APK build, and the live Django test
  passed.
- The 18-request Newman flow confirmed shared Booking ID/status visibility and
  double-booking protection.

External work still required for production:

- deployed HTTPS domains and restricted production CORS;
- real provider secrets and secret-manager integration;
- Android/iOS production signing and Maps keys;
- production email, media storage, Telegram delivery, and Redis/Celery smoke
  tests;
- iOS build and device verification on macOS/Xcode.
