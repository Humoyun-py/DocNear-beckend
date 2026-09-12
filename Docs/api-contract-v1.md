# DocNear API v1 contract

All clients use a configurable origin ending in `/api/v1/`. Success responses
are wrapped as `{ "success": true, "data": ... }`. Errors are wrapped as
`{ "success": false, "code": "...", "message": "...", "errors": {} }`.
Authenticated requests send `Authorization: Bearer <access>`.

## Phone OTP authentication

Phone numbers must match E.164: `^\+[1-9]\d{7,14}$`, for example
`+998901234567`. Clients show: `Telefon raqamni xalqaro formatda kiriting:
+998901234567`.

Request or resend an OTP:

```http
POST /api/v1/auth/request-otp/
POST /api/v1/auth/resend-otp/
Content-Type: application/json

{"phone_number":"+998901234567","purpose":"login","channel":"sms"}
```

`purpose` is `login` or `register`; `channel` is `sms` or `telegram`.
Registration may also include `first_name` and `last_name`. The response is
generic so it does not disclose whether a login phone exists. Telegram returns
`telegram_not_linked` when that phone has no active bot link.

Verify:

```http
POST /api/v1/auth/verify-otp/
Content-Type: application/json

{"phone_number":"+998901234567","code":"482913","purpose":"login"}
```

Success `data` contains `access`, `refresh` and `user`. The OTP is six digits,
hashed at rest, valid for five minutes by default, consumed once and limited to
five attempts. A resend invalidates older active codes.

Session endpoints:

- `POST /api/v1/auth/token/refresh/`
- `POST /api/v1/auth/logout/`
- `GET /api/v1/auth/me/`
- `PATCH /api/v1/auth/me/`

Legacy register/login/password reset routes return `password_auth_disabled` in
normal development and production. Test settings retain them only for existing
compatibility tests.

## Telegram phone link

Bot-only endpoints require `X-Telegram-Bot-Secret`:

- `POST /api/v1/telegram/phone-link/` stores a contact only when
  `contact_user_id == sender_user_id == telegram_user_id`.
- `DELETE /api/v1/telegram/phone-link/` disables the sender's link.
- `POST /api/v1/telegram/request-otp/` requests an OTP for the linked phone.

A phone link alone grants no public access. Telegram appointment endpoints also
require the linked Telegram user header and resolve the linked active patient.

## Booking invariants

Availability comes from the backend. Create appointments with `doctor_id`,
`clinic_id`, `date`, `time` and optional `patient_note`. The backend sets the
patient identity, Booking ID and initial `pending` status. Overlapping slots are
protected by service validation and a PostgreSQL exclusion constraint; a second
booking returns HTTP 409 with `slot_unavailable`.
