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
{"success":false,"code":"validation_error","message":"Request validation failed.","errors":{}}
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
Registration may include `first_name` and `last_name`. Login responses are
generic so they do not disclose whether a phone is registered.

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
- `GET /api/v1/specialties/`
- `GET /api/v1/services/`
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
- `GET /api/v1/notifications/`
- `POST /api/v1/notifications/{id}/read/`
- `POST /api/v1/notifications/read-all/`
- `POST /api/v1/reviews/`

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
- CRUD: `/clinics/`, `/doctors/`, `/specialties/`, `/services/`,
  `/clinic-images/`, `/affiliations/`, `/owners/`
- list/retrieve/patch and enable/disable: `/patients/`
- super-admin CRUD: `/admin-users/`
- list/retrieve/patch: `/appointments/`
- review moderation: `/reviews/{id}/approve/`, `/hide/`, and `DELETE`
- notifications: `GET /notifications/`, `POST /notifications/send/`, and
  `POST /notifications/broadcast/`
- super-admin audit: `GET /logs/`
- super-admin settings: `GET|PATCH /settings/`

Clinic actions are `verify`, `disable`, `enable`, `mark-partner`, and
`remove-partner`. Doctor actions are `verify`, `suspend`, and `activate`.
Appointment search includes Booking ID, patient, doctor, and clinic; filters
include date and status.

## Clinic owner panel

These routes require `clinic_owner`. Every queryset is restricted to clinics
owned by the authenticated user. When an owner has multiple clinics,
clinic-specific singleton routes require `?clinic_id={id}`.

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

## Telegram bot bridge

These server-to-server routes require `X-Telegram-Bot-Secret`; public clients
must not call them directly:

- `POST /api/v1/telegram/phone-link/` accepts a contact only when
  `contact_user_id == sender_user_id == telegram_user_id`.
- `DELETE /api/v1/telegram/phone-link/` disables the sender's link.
- `POST /api/v1/telegram/request-otp/` requests login or registration OTP for
  the linked phone.
- `GET|POST /api/v1/telegram/appointments/` works through the linked active
  patient identity.
- `GET /api/v1/telegram/appointments/by-booking-id/{booking_id}/`

A phone link alone grants no patient access. `/code register` prepares the
registration flow; `/code` requires an active, verified DocNear account.
Booking ID lookup is still scoped to the linked patient and cannot expose
another user's appointment.
