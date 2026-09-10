# DocNear API v1 contract

All clients target one configurable origin and append `/api/v1/`. Deployments must set `API_BASE_URL` (web/Android) or `VITE_API_BASE_URL` (Vite panels); no credential or API origin is hard-coded in client code.

## Conventions

- JSON uses UTF-8 and ISO-8601 timestamps with an explicit offset. The product timezone is `Asia/Tashkent`.
- Successful collection responses use `{ "results": [], "count": number, "next": string|null, "previous": string|null }`.
- Errors use `{ "detail": string, "code": string, "fields": { ... } }` where applicable.
- Bearer JWT is sent as `Authorization: Bearer <access-token>`.
- New public resources use UUIDs. Existing Django compatibility endpoints currently expose integer IDs under `/api/`; migration aliases must preserve old IDs until clients are migrated.

## Resource groups

`/auth/patient/login/`, `/auth/patient/register/`, `/auth/doctor/login/`, `/auth/refresh/`, `/clinics/`, `/doctors/`, `/specialties/`, `/bookings/`, `/favorites/`, `/notifications/`, `/doctor/profile/`, `/doctor/appointments/`, `/doctor/schedule/`, and `/admin/*` are the canonical v1 groups. Every state-changing endpoint must validate ownership and role on the server.

Booking transitions are `pending -> confirmed -> waiting -> in_progress -> completed`; cancellation and rejection are terminal states. Invalid transitions return HTTP 409 with code `invalid_transition`.
