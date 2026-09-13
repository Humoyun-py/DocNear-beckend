# DocNear API v1 contract

This document describes the routes currently exposed by Django. Web panels and
Flutter use a configurable base URL ending in `/api/v1/`. The same application
routes are also mounted under `/api/` for compatibility. Swagger is available
at `/api/docs/` and the OpenAPI schema at `/api/schema/`.

## Common protocol

Authenticated requests use `Authorization: Bearer <access>`. JSON success
responses have this envelope:

```json
{"success":true,"data":{}}
```

Errors have this envelope:

```json
{"success":false,"code":"validation_error","message":"Please check the submitted information.","errors":{}}
```

List endpoints normally put Django REST Framework pagination inside `data`:

```json
{"success":true,"data":{"count":1,"next":null,"previous":null,"results":[]}}
```

Clients must read the server `message` and field-level `errors`. Common status
codes are `200` success, `201` created, `204` deleted, `400` invalid request or
state transition, `401` missing/expired token, `403` wrong role, `404` missing
or out-of-scope object, `409` booking conflict, `429` OTP limit, and `503`
Telegram delivery failure.

## Phone OTP authentication

The backend normalizes accepted Uzbek inputs such as `998901234567` and
`90 123 45 67` to E.164 (`+998901234567`). Invalid numbers are rejected. The
production patient flow requires a phone number and OTP; legacy password
register/login routes return `password_auth_disabled` outside compatibility
tests.

Request or resend:

```http
POST /api/v1/auth/request-otp/
POST /api/v1/auth/resend-otp/
Content-Type: application/json

{"phone_number":"+998901234567","purpose":"login","channel":"sms"}
```

`purpose` is `login` or `register`; `channel` is `sms` or `telegram`.
Registration may include `first_name` and `last_name`. SMS request responses are
generic even when no eligible account exists. Telegram requests instead return
the explicit link/account errors below when delivery cannot proceed.

Verify:

```http
POST /api/v1/auth/verify-otp/
Content-Type: application/json

{"phone_number":"+998901234567","code":"482913","purpose":"login"}
```

Successful verification returns `data.access`, `data.refresh`, and `data.user`.
Codes contain exactly six digits, are stored only as password hashes, expire
after five minutes by default, are consumed once, and allow five attempts by
default. Creating a new code invalidates older active codes.

Session routes:

- `POST /api/v1/auth/token/refresh/` with `{"refresh":"..."}`
- `POST /api/v1/auth/logout/` with `{"refresh":"..."}`
- `GET /api/v1/auth/me/`
- `PATCH /api/v1/auth/me/`

OTP-specific errors include:

```json
{"success":false,"code":"too_many_requests","message":"Yangi kod so‘rashdan oldin biroz kuting.","errors":{}}
```

```json
{"success":false,"code":"telegram_not_linked","message":"Bu raqam Telegram bot bilan ulanmagan. Avval botga kirib telefon raqamingizni ulashing.","errors":{}}
```

```json
{"success":false,"code":"telegram_account_unavailable","message":"Bu raqam uchun DocNear hisobi topilmadi. Avval ro‘yxatdan o‘ting.","errors":{}}
```

```json
{"success":false,"code":"telegram_send_failed","message":"Telegram orqali kod yuborilmadi. Birozdan keyin qayta urinib ko‘ring.","errors":{}}
```

`telegram_send_failed` uses HTTP 503. Telegram OTP returns HTTP 200 only after
Telegram accepts the `sendMessage` request.

## Public discovery

- `GET /api/v1/clinics/` and `GET /api/v1/clinics/{id}/`
- `GET /api/v1/clinics/nearby/?latitude=&longitude=&radius=`
- `GET /api/v1/clinics/emergency/`
- `GET /api/v1/doctors/` and `GET /api/v1/doctors/{id}/`
- `GET /api/v1/doctors/nearby/?latitude=&longitude=&radius=`
- `GET /api/v1/doctors/{id}/availability/?clinic_id={id}&date=YYYY-MM-DD`
- `GET /api/v1/specialties/` and `GET /api/v1/specialties/{id}/`
- `GET /api/v1/services/` and `GET /api/v1/services/{id}/`
- `GET /api/v1/search/?q={text}`
- `GET /api/v1/reviews/?doctor={id}&clinic={id}`

List routes accept supported `search`, `ordering`, filter, and pagination query
parameters. Availability slots and their `available` state always come from
the backend.

## Patient resources and booking

These routes require the `patient` role:

- `GET /api/v1/appointments/` and `GET /api/v1/appointments/my/`
- `GET /api/v1/appointments/{id}/`
- `POST /api/v1/appointments/`
- `POST /api/v1/appointments/{id}/cancel/`
- `POST /api/v1/appointments/{id}/reschedule/`
- `GET /api/v1/favorites/doctors/`
- `POST|DELETE /api/v1/favorites/doctors/{doctor_id}/`
- `GET /api/v1/favorites/clinics/`
- `POST|DELETE /api/v1/favorites/clinics/{clinic_id}/`
- `POST /api/v1/reviews/`
- `GET|POST /api/v1/waitlists/` and `GET /api/v1/waitlists/{id}/`
- `POST /api/v1/waitlists/{id}/cancel/`
- `POST /api/v1/waitlists/{id}/mark-booked/`

Create a booking:

```http
POST /api/v1/appointments/
Authorization: Bearer <patient-access>
Content-Type: application/json

{"doctor_id":7,"clinic_id":3,"date":"2026-09-15","time":"10:00","patient_note":"Nazorat ko‘rigi"}
```

The backend assigns the patient, immutable Booking ID, timestamps, and initial
`pending` status. Clients must display the returned Booking ID and status. A
second active booking for the same doctor and overlapping slot returns:

```json
{"success":false,"code":"slot_unavailable","message":"This appointment time is no longer available.","errors":{}}
```

with HTTP 409. Rescheduling changes the existing appointment and retains its
database identity and Booking ID.

## Notifications

Every authenticated role can access its own notifications through these routes:

- `GET /api/v1/notifications/` and `GET /api/v1/notifications/{id}/`
- `POST /api/v1/notifications/{id}/read/`
- `POST /api/v1/notifications/read-all/`

Lists support `unread=true`, `is_read`, and `type` filters. Their paginated
response includes `data.unread_count` for all unread notifications belonging to
the current user. Reading another user's notification returns `404`.

## Doctor panel

All routes below require the `doctor` role. Querysets are limited to the
authenticated doctor's profile, appointments, patients, schedule items, and
clinics.

- `GET /api/v1/doctor-panel/dashboard/`
- `GET /api/v1/doctor-panel/analytics/`
- `GET|PATCH /api/v1/doctor-panel/profile/`
- `GET /api/v1/doctor-panel/profile/preview/`
- `GET /api/v1/doctor-panel/clinics/`
- `GET|PATCH /api/v1/doctor-panel/schedule/`
- `POST /api/v1/doctor-panel/availability/toggle/`
- `GET /api/v1/doctor-panel/appointments/`
- `GET /api/v1/doctor-panel/appointments/{id}/`
- `POST /api/v1/doctor-panel/appointments/{id}/accept/`
- `POST /api/v1/doctor-panel/appointments/{id}/reject/`
- `POST /api/v1/doctor-panel/appointments/{id}/waiting/`
- `POST /api/v1/doctor-panel/appointments/{id}/start/`
- `POST /api/v1/doctor-panel/appointments/{id}/complete/`
- `POST /api/v1/doctor-panel/appointments/{id}/no-show/`
- `POST /api/v1/doctor-panel/appointments/{id}/cancel/`
- `POST /api/v1/doctor-panel/appointments/{id}/reschedule/`
- `GET /api/v1/doctor-panel/patients/` and `GET .../patients/{id}/`
- `GET|POST /api/v1/doctor-panel/breaks/` and `DELETE .../breaks/{id}/`
- `GET|POST /api/v1/doctor-panel/blocked-times/` and `DELETE .../blocked-times/{id}/`

Appointment lists support Booking ID search, date/status filters, ordering, and
pagination. Status changes are validated by the backend transition service.

## Admin panel

`admin` and `super_admin` can access dashboard and operational resources.
Settings, audit logs, and admin-user management require `super_admin`.

- `GET /api/v1/admin-panel/dashboard/` and `/analytics/`
- list/create and retrieve/patch/delete: `/clinics/`, `/doctors/`,
  `/specialties/`, `/services/`, `/clinic-images/`, `/affiliations/`
- list/retrieve/patch and `POST /{id}/enable/` or `/disable/`: `/patients/`
- list/create, retrieve/patch, and `POST /{id}/enable/` or `/disable/`: `/owners/`
- super-admin list/create, retrieve/patch, and
  `POST /{id}/enable/` or `/disable/`: `/admin-users/`
- list/retrieve and `PATCH /appointments/{id}/` for a validated status change;
  `POST /appointments/{id}/cancel/` and `/reschedule/` are also supported
- review list/retrieve, `POST /reviews/{id}/approve/` or `/hide/`, and
  `DELETE /reviews/{id}/`
- notifications: list/retrieve via `GET /notifications/` or
  `/notifications/{id}/`, plus `POST /notifications/send/` and `/broadcast/`
- super-admin audit: `GET /logs/` and `/logs/{id}/`
- super-admin settings: `GET|PATCH /settings/`

Paths in this section are relative to `/api/v1/admin-panel/`. `PUT` is not
supported. Patients, owners, and admin-user accounts have no DELETE endpoint;
use their enable/disable actions. DELETE on clinics, doctors, specialties,
services, and affiliations deactivates the object rather than removing its row.

Clinic actions use `POST /clinics/{id}/{action}/`, where action is `verify`,
`disable`, `enable`, `mark-partner`, or `remove-partner`. Doctor actions use
`POST /doctors/{id}/{action}/` with `verify`, `suspend`, or `activate`.
Appointment search includes Booking ID, patient, doctor, and clinic; filters
include date and status.

## Clinic owner panel

These routes require `clinic_owner`. Every queryset is restricted to clinics
owned by the authenticated user. The `/clinic/` and `/services/` routes require
`?clinic_id={id}` when an owner has multiple clinics. Dashboard and analytics
aggregate the owner's clinics unless that query parameter is supplied.
Schedule lists span the owner's clinics.

- `GET /api/v1/clinic-owner/dashboard/` and `/analytics/`
- `GET /api/v1/clinic-owner/clinics/`
- `GET|PATCH /api/v1/clinic-owner/clinic/`
- `GET|PATCH /api/v1/clinic-owner/services/`
- `GET /api/v1/clinic-owner/schedule/`
- `GET|POST /api/v1/clinic-owner/doctors/`
- `GET|PATCH /api/v1/clinic-owner/doctors/{id}/`
- `GET /api/v1/clinic-owner/appointments/`
- `GET /api/v1/clinic-owner/appointments/{id}/`

Owner appointment lists support Booking ID search, patient/doctor search,
status/date filters, and pagination.

Owner `/doctors/{id}/` addresses a doctor-clinic affiliation ID. Use the
returned doctor profile ID when calling public doctor detail, availability,
or booking endpoints.

## Telegram bot bridge

Bot write/identity routes use `X-Telegram-Bot-Secret`, which must remain on the
bot server. Phone-link and OTP routes receive the Telegram user ID in the JSON
body:

- `POST /api/v1/telegram/phone-link/` accepts a contact only when
  `contact_user_id == sender_user_id == telegram_user_id`.
- `DELETE /api/v1/telegram/phone-link/` disables the sender's link.
- `POST /api/v1/telegram/request-otp/` requests login or registration OTP for
  the linked phone.
- `POST /api/v1/telegram/link/` redeems a one-time link code with
  `{"code":"...","telegram_user_id":123}`.

Appointment routes require **both** `X-Telegram-Bot-Secret` and
`X-Telegram-User-Id`. The backend resolves an active linked patient from these
headers; a patient JWT is not used for these routes:

- `GET|POST /api/v1/telegram/appointments/`
- `GET /api/v1/telegram/appointments/my/`
- `GET /api/v1/telegram/appointments/{id}/`
- `POST /api/v1/telegram/appointments/{id}/cancel/`
- `POST /api/v1/telegram/appointments/{id}/reschedule/`
- `GET /api/v1/telegram/appointments/by-booking-id/{booking_id}/`

`POST|DELETE /api/v1/telegram/link-code/` instead uses the normal patient JWT:
POST creates a ten-minute link code; DELETE removes the legacy account link
and invalidates unused link codes. `/phone-link/` manages contact-based links
separately.

Public discovery aliases require no bot secret:

- `GET /api/v1/telegram/clinics/nearby/`
- `GET /api/v1/telegram/search/`
- `GET /api/v1/telegram/doctors/{id}/availability/`

A phone link does not create a DocNear account or issue JWTs. `/code register`
prepares registration; `/code` requires an active, verified DocNear account.
Booking ID lookup is scoped to the linked active patient and cannot expose
another user's appointment.

## Local diagnostics

`python backend/manage.py telegram_status` checks getMe and getWebhookInfo
separately. A failed webhook-info call reports unknown webhook/polling status
without incorrectly reporting token authentication failure. Polling
compatibility means that Telegram has no configured webhook; it does not prove
that a local polling process is running. Tokens, webhook secrets, and webhook
URLs are omitted from output.

`python backend/manage.py otp_status` reports aggregate unconsumed challenge
counts. Active challenges have time and attempts remaining; exhausted means
the attempt limit has been reached before expiry. Expired challenges are
counted separately. Consumed/invalidated challenges are excluded, and no phone,
hash, or code is printed.

The isolated QA launcher `scripts/run-integration-qa.sh` creates its own random
bridge secret on first run at `.runtime/integration/telegram-secret` with file
mode `0600` and reuses it on later runs. This secret is for local QA only.
