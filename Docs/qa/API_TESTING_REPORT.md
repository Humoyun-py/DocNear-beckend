# API Testing Report

**Project:** DocNear. **Test date:** September 7, 2026 (Asia/Tashkent). **Outcome:** the required booking acceptance flow passes through real HTTP requests; the expanded backend suite passes. No unresolved critical booking or permission defect was found in the exercised cases. Documentation and product-policy discrepancies remain below; this is not a production certification.

## Evidence and scope

- **1,153 pytest tests passed; zero failed and zero skipped**, in 84.64 seconds.
- This includes **1,026 role-boundary probes**: 171 business API method/path combinations × six caller types. The remaining 127 tests cover business behavior, regressions, authentication, isolation, transactions, documentation and artifact consistency.
- **173 API operations** are inventoried in total, including OpenAPI and Swagger. Documentation endpoints are checked separately from the six-role matrix. HEAD/OPTIONS, format aliases, navigation roots and Django's session-based admin are not counted as business operations.
- **Newman: 18 real HTTP requests and 47 assertions passed**, zero failures. The collection ran against the Django development server, with a real PostgreSQL database.
- **PostgreSQL 16**, Python 3.12, Django 5.2, DRF and SimpleJWT from the installed/pinned environment. Test database: `test_docnear_qa`; live smoke database: `docnear_qa`, both local and isolated. No SQLite or external clinic data was used.
- Tests use real JWTs for the complete cross-platform flow and the full permission matrix. Older focused tests also use DRF's forced-authentication helper where the scenario concerns object ownership rather than JWT processing.
- A final focused rerun after test-cache isolation and cleanup also passed: **30 tests**, zero failures (`final-focused-results.xml`). Test caches are forced to local memory so fixture cleanup cannot flush a configured Redis service.
- Django checks passed; no model migrations are pending. The generated OpenAPI document validates with no generation warnings. Ruff and Python compilation checks passed.
- Accounts represent patient A, patient B, doctor, clinic owner, admin and super admin. Credentials and JWTs are kept in test memory or a private local Postman environment, not committed.

Evidence files: `pytest-results.xml`, `newman-results.xml`, `test-summary.json`, `permission-results.json`. The matrix's 400/404 outcomes on authorized probes are intentional: those probes use empty request bodies or missing record IDs to test the permission boundary. Successful writes, transitions and valid detail access are exercised separately. The matrix is **not** a claim of 1,026 successful business actions.

## Tested Modules

Auth; patient profile and search; clinics; doctors; nearby discovery; availability; appointments; favorites; reviews; notifications; doctor panel; admin panel; clinic owner panel; Telegram account linking and shared booking APIs; response envelopes and production error handling; documentation and route inventory.

## Working APIs

The complete grouped list is in `API_ENDPOINTS.md` and the Postman collection. The following behavior passed:

- **Auth:** registration, duplicate email/phone rejection, weak-password validation, login for every role, wrong-password rejection, expired/invalid/wrong-signature token rejection, access/refresh token separation, token rotation, logout, foreign-token logout rejection, password change/reset, disabled-account rejection, and login throttling.
- **Public discovery:** only active verified partner clinics; active verified doctors associated with public clinics; radius and distance ordering; invalid/missing/non-finite coordinates; partial specialty search; clinic/doctor filters; related doctors, services, gallery images and hours; emergency and 24/7 filtering.
- **Availability:** working days, closed clinics, breaks, blocks, bookings, duration, buffers, daily limits, past/invalid dates, unavailable doctors and unrelated clinics. Proposed schedule changes roll back if they invalidate existing appointments.
- **Appointments:** authenticated patient identity, generated Booking ID, own-booking lists/details, cancellation, rescheduling, valid/invalid transitions, cross-role visibility of the same record, and preservation of the original booking when rescheduling fails.
- **Double booking:** sequential duplicate rejection; simultaneous creates through the API stack; simultaneous reschedules; the direct PostgreSQL exclusion constraint; cross-clinic overlaps for the same doctor; non-overlapping times and different doctors allowed. Separate worker threads use independent database connections.
- **Doctor panel:** dashboard, analytics, assignments, own patients and appointment history, profile review, schedule/break/block management, booking availability toggle, confirm/reject/start/complete/no-show/cancel/reschedule. Other doctors' records are inaccessible.
- **Admin panel:** clinic and doctor lifecycle actions; owners and admins; patient updates/account status; appointment search and transitions; specialties/services; multipart gallery images; review moderation; notifications; super-admin settings and audit logs.
- **Clinic owner panel:** owned clinic details/updates, doctors, appointments, services, schedules and analytics; unowned data is rejected; approval flags and doctor identity cannot be changed through owner updates; appointment notes are omitted from owner responses.
- **Favorites/reviews/notifications:** deduplication and per-user isolation; only a completed appointment's patient can review it; one review per appointment; moderation updates ratings; read/unread counts and targeted broadcasts work.
- **Telegram:** patient linking, one-time code use, unlinking, public search/availability, private booking lookup, creation/rescheduling/cancellation and cross-panel visibility. Booking ID alone grants no access; a JWT cannot replace bot credentials.
- **Responses:** tested successes and validation/auth/access/not-found/conflict errors use the expected JSON envelope. A deliberately injected unhandled exception uses the sanitized production JSON 500 handler. Health database failures return sanitized 503. No client traceback or private exception message is exposed in that production test.

## Broken APIs — defects found and fixed

### QA-01 — Favorites collection mutations returned 500

- **Endpoints/methods:** `POST` and `DELETE /api/favorites/doctors/`, `/api/favorites/clinics/`.
- **Problem:** collection routes exposed methods whose handlers required an absent `pk`; a request raised TypeError. Detail GET was also incorrectly advertised as a list action.
- **Observed error:** HTTP 500; the production handler returned `code:server_error`.
- **Expected:** GET on collections; POST/DELETE on ID routes; unsupported collection mutations return 405.
- **Fix:** separate list and mutation view classes with explicit method lists, so routing and introspected documentation agree. This also removed six nonexistent operations from the original 179-operation inventory.
- **Verification:** favorites lifecycle tests, four collection-mutation regressions, inventory consistency and all role probes pass.

### QA-02 — Malformed schedule policy clinic IDs returned 500

- **Endpoint/method:** `PATCH /api/doctor-panel/schedule/`.
- **Problem:** the policies list accepted arbitrary dictionaries; invalid clinic values reached the ORM before typed validation.
- **Observed error:** HTTP 500 for values such as `"invalid"` or `{}`.
- **Expected:** HTTP 400 with field validation errors; no schedule change.
- **Fix:** typed `BookingPolicyInputSerializer` and validation before lookup in the schedule service. Weekly schedule lookup now uses validated values too.
- **Verification:** malformed policies, valid updates, limit validation and transaction rollback tests pass.

### QA-03 — Public doctor filters disclosed unpublished affiliations

- **Endpoints/methods:** `GET /api/doctors/?clinic=...`, `?specialty=...`, `?search=...`, and `GET /api/search/?q=...`.
- **Problem:** a public doctor could match a second inactive/unpublished clinic relationship, allowing callers to infer a hidden affiliation or specialty.
- **Observed error:** HTTP 200 contained the doctor when the filter should have returned no match.
- **Expected:** relationship-based filtering and search must use active affiliations at active, verified, partner clinics.
- **Fix:** filter via public affiliation joins/subqueries. DRF search's distinct handling was adapted to the filtered relation alias; regression tests caught and corrected that compatibility issue.
- **Verification:** hidden clinic/specialty/search cases return no doctors; normal public filters and nearby lookup still pass.

### QA-04 — Emergency discovery rejected ordinary pagination

- **Endpoint/method:** `GET /api/clinics/emergency/?page_size=10`.
- **Problem:** any query parameter enabled coordinate validation.
- **Observed error:** HTTP 400 requiring latitude and longitude when only pagination was supplied.
- **Expected:** emergency listings can paginate without coordinates; coordinates are required only when a location/radius search is requested.
- **Fix:** enable geographic filtering only when latitude, longitude or radius is present. Add deterministic fallback ordering after aggregation.
- **Verification:** paginated emergency discovery, nearby radius and distance sorting tests pass.

### QA-05 — Start rejected a confirmed appointment

- **Endpoint/method:** `POST /api/doctor-panel/appointments/{id}/start/`.
- **Problem:** the panel action accepted only an appointment already in `waiting`, despite the requested ability to start a confirmed appointment.
- **Observed error:** HTTP 409 `invalid_status_transition` from confirmed to in-progress.
- **Expected:** a doctor can start an owned confirmed appointment when its scheduled time has arrived.
- **Fix:** a transactional Start service performs and audits check-in (`waiting`) before `in_progress`. Ownership and time checks remain in place, and failure rolls back both changes.
- **Verification:** both full sequential flow and direct Start from confirmed pass; early and invalid terminal transitions remain rejected.

### QA-06 — Telegram authentication missing from OpenAPI

- **Endpoints:** `/api/telegram/appointments/...` and `/api/telegram/link/`.
- **Problem:** schema generation could not describe the custom authenticator, presenting an incomplete security contract to integrators.
- **Expected:** declare bot-secret and linked-user headers together; link redemption needs the bot secret only.
- **Fix:** register the custom security extension and declare link redemption authentication. Schema-only query guards and role enum overrides remove generation warnings.
- **Verification:** schema access/security assertions and OpenAPI structural validation pass with no warnings.

### QA-07 — Unstable admin patient pagination

- **Endpoint/method:** `GET /api/admin-panel/patients/`.
- **Problem:** booking-count aggregation left pagination without deterministic ordering and raised a Django pagination warning.
- **Fix:** order by user ID. Paginated reads pass with no warning in the final suite.

The expanded tests also exposed **test-only shared throttle-cache state**: two otherwise unrelated authentication tests received 429 after previous tests had consumed the rate limit. The test fixture now clears the cache between tests. Production throttling remains enabled and has a dedicated passing regression test.

## Security Issues

- The confirmed unpublished-affiliation disclosure (QA-03) is fixed.
- No tested role escalation, foreign appointment access, owner cross-clinic mutation, foreign-token logout or Telegram Booking ID bypass succeeded.
- Ordinary admins cannot manage administrator accounts, platform settings or full audit logs; those are restricted to super admins.
- **Unresolved product-policy discrepancy:** the prompt says Super Admin “accesses everything.” The implementation deliberately restricts personal patient/doctor/owner URLs to those roles, while super admins access all corresponding records through admin APIs. The matrix records those 403 responses transparently. Granting blanket personal-route access would require an explicit target/impersonation design; those guards were not weakened as a speculative fix.
- This suite does not constitute a penetration test, dependency vulnerability audit, production proxy/CORS assessment, or verification of browser/mobile token storage.

## Booking Issues

No failing booking acceptance or race scenario remains in this suite. PostgreSQL rejects overlapping reservations even if both clinics publish overlapping work schedules for the same doctor. A physician cannot attend two clinics simultaneously. Non-overlapping visits and different doctors work.

Booking IDs use a 10-character hexadecimal suffix, rather than the six-character illustrative suffix in the prompt. Clients must treat IDs as opaque values.

## Integration Issues

1. **Flutter/React applications are absent from this checkout.** The backend API contract and real HTTP flow are verified; Dio refresh synchronization, secure storage, Riverpod providers, React screens, polling and end-user UI flows were not executed.
2. **OpenAPI response schemas are not yet a complete runtime contract.** Structural validation and Telegram security metadata are correct, but the `success/data` renderer envelope and all dynamic dashboard/action response payloads are not fully reflected in the generated types. This remains a documentation defect. Use `docs/api-contract.md` and the tested requests until response annotations are completed.
3. The owner API prefix is `/api/clinic-owner/`. Owner doctor details take an **affiliation ID**, not a public DoctorProfile ID. The Postman collection handles this distinction.
4. The Postman module folders need appropriate IDs and record states; they are a request reference, not a single sequential scenario. The dedicated E2E folder is the verified executable flow.
5. Outbound email delivery, a deployed Telegram bot, Redis/Celery delivery, real clinic verification and production deployment were not exercised. Password reset was tested with Django's test email backend; Telegram APIs were tested directly.

## Priority Fixes

### Critical

No unresolved critical defect was found in the tested booking/auth/access scenarios. Production readiness is not asserted.

### High

QA-03 public-affiliation disclosure: fixed and covered by regression tests. QA-01/02 input-triggered 500s: fixed. QA-05 confirmed-appointment Start: fixed.

### Medium

Complete OpenAPI response schemas for the renderer envelope and dynamic actions. Resolve the super-admin personal-route policy discrepancy if literal access to every URL is required. Connect and test the actual Flutter/React clients when their source is available.

### Low

QA-04 emergency pagination, QA-06 Telegram schema security and QA-07 stable pagination are fixed. Production-scale performance/load testing and outbound provider checks remain separate validation work.

## Reproduction

From the repository root, set `DATABASE_URL` to an isolated PostgreSQL database whose user can create the temporary test database and `btree_gist` extension. Install `backend/requirements-dev.txt` into `.venv`, then run:

```bash
./scripts/test-api.sh
```

This runs Django checks, pytest, JUnit export and observed permission-matrix generation. See `postman/README.md` for fixture accounts, private environment preparation and the real HTTP acceptance flow.

## Acceptance Flow Confirmation

The executed Newman folder verified: patient login → nearby partner clinic → that clinic's doctor → real availability → booking with generated ID → doctor sees pending booking → doctor confirms → patient/admin/owner/super-admin see the same confirmed ID → second patient's duplicate request returns 409. Its cleanup step cancelled only the fictional QA booking. The API-level acceptance flow passes.
