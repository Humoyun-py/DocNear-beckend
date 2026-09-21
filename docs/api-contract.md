# DocNear client integration contract

One PostgreSQL database and one API serve patients, doctors, clinic owners, administrators and Telegram. Client rendering was not tested: this checkout contains no Flutter or React source.

## Transport and authentication

Base API prefix: `/api/`. Use trailing slashes. Registration and login return `data.user`, `data.access` and `data.refresh`. Access tokens expire after five minutes by default; refresh tokens rotate on refresh and their previous values are blacklisted. Clients must replace **both** returned tokens, serialize concurrent refreshes, retry only once, and handle expired refresh tokens by signing out. Password changes invalidate existing access tokens and blacklist outstanding refresh tokens.

Patient identity always comes from authentication; a body `patient_id` cannot choose another patient's identity. Role fields supplied during registration/profile updates cannot escalate privileges. Browser/mobile token storage and interceptor behavior have not been verified because the clients are absent.

## Response bodies

Successful JSON responses contain `{"success":true,"data":...}`. Paginated lists contain `data.results`, `data.count`, `data.next` and `data.previous`, with optional `unread_count` for notifications. HTTP 204 has an empty body. Errors contain `success:false`, `code`, `message` and `errors`.

The generated `docs/qa/openapi.yaml` validates structurally and now declares Telegram authentication correctly. Some **response schemas are still incomplete**: the runtime `EnvelopeRenderer` adds the envelope, and dynamic dashboard/action response types are not all described accurately. Use this contract, the endpoint inventory, and the tested Postman requests when integrating; do not assume generated model types fully describe response bodies. This is a known documentation gap, not an observed booking runtime failure.

## Booking

Get real slots from `GET /api/doctors/{doctor_id}/availability/?date=YYYY-MM-DD&clinic_id=ID`.

Submit `doctor_id`, `clinic_id`, `date`, `time` and optional `patient_note` to `POST /api/appointments/`. Dates must be within the next 180 days, and booking times are whole-minute Asia/Tashkent local times. Never generate final availability in a client.

The server generates `booking_id`, `end_time`, patient identity and initial `pending` status. The current ID format is `DN-YYYYMMDD-` plus **10 uppercase hexadecimal characters**. The prompt's six-character suffix was an example, not the implemented format. Clients should treat the entire Booking ID as an opaque string.

Slots reserve the doctor's time plus the configured buffer across all clinics. Even when two clinics both have working schedules for that doctor, physically overlapping bookings are rejected. Completed and no-show appointments also retain their reserved intervals.

Typical flow: pending → confirmed → waiting → in_progress → completed. The doctor panel's Start action performs the waiting transition automatically for a confirmed visit; both events remain in the audit history. Clinical actions cannot occur before the scheduled start. Cancelled/rejected/completed states cannot restart. Rescheduling a pending/confirmed visit validates availability and returns it to pending.

A failed duplicate/reschedule race returns HTTP 409 with `code:slot_unavailable`; refetch availability and ask the patient to choose again. Schedule edits that invalidate booked visits return 409 with `code:schedule_conflict` and roll back.

## Routes and scope

- Patient bookings: `/api/appointments/` and `/api/appointments/my/`.
- Doctor workspace: `/api/doctor-panel/`.
- Admin workspace: `/api/admin-panel/`.
- Clinic owner workspace: `/api/clinic-owner/` — not `/api/clinic-owner-panel/`.
- Owner doctor IDs identify **affiliations**, whereas public/admin doctor IDs identify DoctorProfile records.
- Owner appointment responses omit `patient_note`.
- Owner endpoints that select one clinic require `?clinic_id=` when the owner has multiple clinics.
- Favorites: GET on the collection; POST/DELETE on the doctor/clinic ID path. Collection POST/DELETE are unsupported and return 405.
- Notifications for any signed-in role: `/api/notifications/`; admin notification management uses `/api/admin-panel/notifications/`.
- Super admins manage all platform records through admin APIs. Personal patient/doctor/owner routes remain role-scoped; super admins do not automatically impersonate those roles.
- Telegram needs a server secret plus a linked Telegram identity for private booking data. A Booking ID alone is insufficient.
