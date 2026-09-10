# DocNear API endpoint inventory

Generated from the Django URL resolver. Base URL: `http://127.0.0.1:8000`.

354 API method/path combinations. `HEAD`/`OPTIONS` and router format suffix aliases are omitted. `/health/`, Django `/admin/`, and router navigation roots are listed separately below.

Pagination: `data.results`, `data.count`, `data.next`, `data.previous`; page size defaults to 20 (maximum 100). All appointment times use Asia/Tashkent.

Personal routes are role-scoped. Super admins have platform-wide record access through `/api/admin-panel/`; they do not impersonate a patient, doctor or owner. This differs from a literal “all URLs” reading of the prompt.

## Admin Panel

- `GET /api/admin-panel/admin-users/` — super_admin.
- `POST /api/admin-panel/admin-users/` — super_admin.
- `GET /api/admin-panel/admin-users/{pk}/` — super_admin.
- `PATCH /api/admin-panel/admin-users/{pk}/` — super_admin.
- `POST /api/admin-panel/admin-users/{pk}/disable/` — super_admin.
- `POST /api/admin-panel/admin-users/{pk}/enable/` — super_admin.
- `GET /api/admin-panel/affiliations/` — admin, super_admin.
- `POST /api/admin-panel/affiliations/` — admin, super_admin.
- `DELETE /api/admin-panel/affiliations/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/affiliations/{pk}/` — admin, super_admin.
- `PATCH /api/admin-panel/affiliations/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/analytics/` — admin, super_admin.
- `GET /api/admin-panel/appointments/` — admin, super_admin.
- `GET /api/admin-panel/appointments/{pk}/` — admin, super_admin.
- `PATCH /api/admin-panel/appointments/{pk}/` — admin, super_admin.
- `POST /api/admin-panel/appointments/{pk}/cancel/` — admin, super_admin.
- `POST /api/admin-panel/appointments/{pk}/reschedule/` — admin, super_admin.
- `GET /api/admin-panel/clinic-images/` — admin, super_admin.
- `POST /api/admin-panel/clinic-images/` — admin, super_admin.
- `DELETE /api/admin-panel/clinic-images/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/clinic-images/{pk}/` — admin, super_admin.
- `PATCH /api/admin-panel/clinic-images/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/clinics/` — admin, super_admin.
- `POST /api/admin-panel/clinics/` — admin, super_admin.
- `DELETE /api/admin-panel/clinics/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/clinics/{pk}/` — admin, super_admin.
- `PATCH /api/admin-panel/clinics/{pk}/` — admin, super_admin.
- `POST /api/admin-panel/clinics/{pk}/disable/` — admin, super_admin.
- `POST /api/admin-panel/clinics/{pk}/enable/` — admin, super_admin.
- `POST /api/admin-panel/clinics/{pk}/mark-partner/` — admin, super_admin.
- `POST /api/admin-panel/clinics/{pk}/remove-partner/` — admin, super_admin.
- `POST /api/admin-panel/clinics/{pk}/verify/` — admin, super_admin.
- `GET /api/admin-panel/dashboard/` — admin, super_admin.
- `GET /api/admin-panel/doctors/` — admin, super_admin.
- `POST /api/admin-panel/doctors/` — admin, super_admin.
- `DELETE /api/admin-panel/doctors/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/doctors/{pk}/` — admin, super_admin.
- `PATCH /api/admin-panel/doctors/{pk}/` — admin, super_admin.
- `POST /api/admin-panel/doctors/{pk}/activate/` — admin, super_admin.
- `POST /api/admin-panel/doctors/{pk}/suspend/` — admin, super_admin.
- `POST /api/admin-panel/doctors/{pk}/verify/` — admin, super_admin.
- `GET /api/admin-panel/logs/` — super_admin.
- `GET /api/admin-panel/logs/{pk}/` — super_admin.
- `GET /api/admin-panel/notifications/` — admin, super_admin.
- `POST /api/admin-panel/notifications/broadcast/` — admin, super_admin.
- `POST /api/admin-panel/notifications/send/` — admin, super_admin.
- `GET /api/admin-panel/notifications/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/owners/` — admin, super_admin.
- `POST /api/admin-panel/owners/` — admin, super_admin.
- `GET /api/admin-panel/owners/{pk}/` — admin, super_admin.
- `PATCH /api/admin-panel/owners/{pk}/` — admin, super_admin.
- `POST /api/admin-panel/owners/{pk}/disable/` — admin, super_admin.
- `POST /api/admin-panel/owners/{pk}/enable/` — admin, super_admin.
- `GET /api/admin-panel/patients/` — admin, super_admin.
- `GET /api/admin-panel/patients/{pk}/` — admin, super_admin.
- `PATCH /api/admin-panel/patients/{pk}/` — admin, super_admin.
- `POST /api/admin-panel/patients/{pk}/disable/` — admin, super_admin.
- `POST /api/admin-panel/patients/{pk}/enable/` — admin, super_admin.
- `GET /api/admin-panel/reviews/` — admin, super_admin.
- `DELETE /api/admin-panel/reviews/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/reviews/{pk}/` — admin, super_admin.
- `POST /api/admin-panel/reviews/{pk}/approve/` — admin, super_admin.
- `POST /api/admin-panel/reviews/{pk}/hide/` — admin, super_admin.
- `GET /api/admin-panel/services/` — admin, super_admin.
- `POST /api/admin-panel/services/` — admin, super_admin.
- `DELETE /api/admin-panel/services/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/services/{pk}/` — admin, super_admin.
- `PATCH /api/admin-panel/services/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/settings/` — super_admin.
- `PATCH /api/admin-panel/settings/` — super_admin.
- `GET /api/admin-panel/specialties/` — admin, super_admin.
- `POST /api/admin-panel/specialties/` — admin, super_admin.
- `DELETE /api/admin-panel/specialties/{pk}/` — admin, super_admin.
- `GET /api/admin-panel/specialties/{pk}/` — admin, super_admin.
- `PATCH /api/admin-panel/specialties/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/admin-users/` — super_admin.
- `POST /api/v1/admin-panel/admin-users/` — super_admin.
- `GET /api/v1/admin-panel/admin-users/{pk}/` — super_admin.
- `PATCH /api/v1/admin-panel/admin-users/{pk}/` — super_admin.
- `POST /api/v1/admin-panel/admin-users/{pk}/disable/` — super_admin.
- `POST /api/v1/admin-panel/admin-users/{pk}/enable/` — super_admin.
- `GET /api/v1/admin-panel/affiliations/` — admin, super_admin.
- `POST /api/v1/admin-panel/affiliations/` — admin, super_admin.
- `DELETE /api/v1/admin-panel/affiliations/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/affiliations/{pk}/` — admin, super_admin.
- `PATCH /api/v1/admin-panel/affiliations/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/analytics/` — admin, super_admin.
- `GET /api/v1/admin-panel/appointments/` — admin, super_admin.
- `GET /api/v1/admin-panel/appointments/{pk}/` — admin, super_admin.
- `PATCH /api/v1/admin-panel/appointments/{pk}/` — admin, super_admin.
- `POST /api/v1/admin-panel/appointments/{pk}/cancel/` — admin, super_admin.
- `POST /api/v1/admin-panel/appointments/{pk}/reschedule/` — admin, super_admin.
- `GET /api/v1/admin-panel/clinic-images/` — admin, super_admin.
- `POST /api/v1/admin-panel/clinic-images/` — admin, super_admin.
- `DELETE /api/v1/admin-panel/clinic-images/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/clinic-images/{pk}/` — admin, super_admin.
- `PATCH /api/v1/admin-panel/clinic-images/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/clinics/` — admin, super_admin.
- `POST /api/v1/admin-panel/clinics/` — admin, super_admin.
- `DELETE /api/v1/admin-panel/clinics/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/clinics/{pk}/` — admin, super_admin.
- `PATCH /api/v1/admin-panel/clinics/{pk}/` — admin, super_admin.
- `POST /api/v1/admin-panel/clinics/{pk}/disable/` — admin, super_admin.
- `POST /api/v1/admin-panel/clinics/{pk}/enable/` — admin, super_admin.
- `POST /api/v1/admin-panel/clinics/{pk}/mark-partner/` — admin, super_admin.
- `POST /api/v1/admin-panel/clinics/{pk}/remove-partner/` — admin, super_admin.
- `POST /api/v1/admin-panel/clinics/{pk}/verify/` — admin, super_admin.
- `GET /api/v1/admin-panel/dashboard/` — admin, super_admin.
- `GET /api/v1/admin-panel/doctors/` — admin, super_admin.
- `POST /api/v1/admin-panel/doctors/` — admin, super_admin.
- `DELETE /api/v1/admin-panel/doctors/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/doctors/{pk}/` — admin, super_admin.
- `PATCH /api/v1/admin-panel/doctors/{pk}/` — admin, super_admin.
- `POST /api/v1/admin-panel/doctors/{pk}/activate/` — admin, super_admin.
- `POST /api/v1/admin-panel/doctors/{pk}/suspend/` — admin, super_admin.
- `POST /api/v1/admin-panel/doctors/{pk}/verify/` — admin, super_admin.
- `GET /api/v1/admin-panel/logs/` — super_admin.
- `GET /api/v1/admin-panel/logs/{pk}/` — super_admin.
- `GET /api/v1/admin-panel/notifications/` — admin, super_admin.
- `POST /api/v1/admin-panel/notifications/broadcast/` — admin, super_admin.
- `POST /api/v1/admin-panel/notifications/send/` — admin, super_admin.
- `GET /api/v1/admin-panel/notifications/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/owners/` — admin, super_admin.
- `POST /api/v1/admin-panel/owners/` — admin, super_admin.
- `GET /api/v1/admin-panel/owners/{pk}/` — admin, super_admin.
- `PATCH /api/v1/admin-panel/owners/{pk}/` — admin, super_admin.
- `POST /api/v1/admin-panel/owners/{pk}/disable/` — admin, super_admin.
- `POST /api/v1/admin-panel/owners/{pk}/enable/` — admin, super_admin.
- `GET /api/v1/admin-panel/patients/` — admin, super_admin.
- `GET /api/v1/admin-panel/patients/{pk}/` — admin, super_admin.
- `PATCH /api/v1/admin-panel/patients/{pk}/` — admin, super_admin.
- `POST /api/v1/admin-panel/patients/{pk}/disable/` — admin, super_admin.
- `POST /api/v1/admin-panel/patients/{pk}/enable/` — admin, super_admin.
- `GET /api/v1/admin-panel/reviews/` — admin, super_admin.
- `DELETE /api/v1/admin-panel/reviews/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/reviews/{pk}/` — admin, super_admin.
- `POST /api/v1/admin-panel/reviews/{pk}/approve/` — admin, super_admin.
- `POST /api/v1/admin-panel/reviews/{pk}/hide/` — admin, super_admin.
- `GET /api/v1/admin-panel/services/` — admin, super_admin.
- `POST /api/v1/admin-panel/services/` — admin, super_admin.
- `DELETE /api/v1/admin-panel/services/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/services/{pk}/` — admin, super_admin.
- `PATCH /api/v1/admin-panel/services/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/settings/` — super_admin.
- `PATCH /api/v1/admin-panel/settings/` — super_admin.
- `GET /api/v1/admin-panel/specialties/` — admin, super_admin.
- `POST /api/v1/admin-panel/specialties/` — admin, super_admin.
- `DELETE /api/v1/admin-panel/specialties/{pk}/` — admin, super_admin.
- `GET /api/v1/admin-panel/specialties/{pk}/` — admin, super_admin.
- `PATCH /api/v1/admin-panel/specialties/{pk}/` — admin, super_admin.

## Appointments

- `GET /api/appointments/` — patient.
- `POST /api/appointments/` — patient.
- `GET /api/appointments/my/` — patient.
- `GET /api/appointments/{pk}/` — patient.
- `POST /api/appointments/{pk}/cancel/` — patient.
- `POST /api/appointments/{pk}/reschedule/` — patient.
- `GET /api/v1/appointments/` — patient.
- `POST /api/v1/appointments/` — patient.
- `GET /api/v1/appointments/my/` — patient.
- `GET /api/v1/appointments/{pk}/` — patient.
- `POST /api/v1/appointments/{pk}/cancel/` — patient.
- `POST /api/v1/appointments/{pk}/reschedule/` — patient.

## Auth

- `POST /api/auth/change-password/` — patient, doctor, clinic_owner, admin, super_admin.
- `POST /api/auth/forgot-password/` — Public.
- `POST /api/auth/login/` — Public.
- `POST /api/auth/logout/` — patient, doctor, clinic_owner, admin, super_admin.
- `GET /api/auth/me/` — patient, doctor, clinic_owner, admin, super_admin.
- `PATCH /api/auth/me/` — patient, doctor, clinic_owner, admin, super_admin.
- `POST /api/auth/register/` — Public.
- `POST /api/auth/reset-password/` — Public.
- `POST /api/auth/token/refresh/` — Public.
- `POST /api/v1/auth/change-password/` — patient, doctor, clinic_owner, admin, super_admin.
- `POST /api/v1/auth/forgot-password/` — Public.
- `POST /api/v1/auth/login/` — Public.
- `POST /api/v1/auth/logout/` — patient, doctor, clinic_owner, admin, super_admin.
- `GET /api/v1/auth/me/` — patient, doctor, clinic_owner, admin, super_admin.
- `PATCH /api/v1/auth/me/` — patient, doctor, clinic_owner, admin, super_admin.
- `POST /api/v1/auth/register/` — Public.
- `POST /api/v1/auth/reset-password/` — Public.
- `POST /api/v1/auth/token/refresh/` — Public.

## Clinic Owner Panel

- `GET /api/clinic-owner/analytics/` — clinic_owner.
- `GET /api/clinic-owner/appointments/` — clinic_owner.
- `GET /api/clinic-owner/appointments/{pk}/` — clinic_owner.
- `GET /api/clinic-owner/clinic/` — clinic_owner.
- `PATCH /api/clinic-owner/clinic/` — clinic_owner.
- `GET /api/clinic-owner/clinics/` — clinic_owner.
- `GET /api/clinic-owner/dashboard/` — clinic_owner.
- `GET /api/clinic-owner/doctors/` — clinic_owner.
- `POST /api/clinic-owner/doctors/` — clinic_owner.
- `GET /api/clinic-owner/doctors/{pk}/` — clinic_owner.
- `PATCH /api/clinic-owner/doctors/{pk}/` — clinic_owner.
- `GET /api/clinic-owner/schedule/` — clinic_owner.
- `GET /api/clinic-owner/services/` — clinic_owner.
- `PATCH /api/clinic-owner/services/` — clinic_owner.
- `GET /api/v1/clinic-owner/analytics/` — clinic_owner.
- `GET /api/v1/clinic-owner/appointments/` — clinic_owner.
- `GET /api/v1/clinic-owner/appointments/{pk}/` — clinic_owner.
- `GET /api/v1/clinic-owner/clinic/` — clinic_owner.
- `PATCH /api/v1/clinic-owner/clinic/` — clinic_owner.
- `GET /api/v1/clinic-owner/clinics/` — clinic_owner.
- `GET /api/v1/clinic-owner/dashboard/` — clinic_owner.
- `GET /api/v1/clinic-owner/doctors/` — clinic_owner.
- `POST /api/v1/clinic-owner/doctors/` — clinic_owner.
- `GET /api/v1/clinic-owner/doctors/{pk}/` — clinic_owner.
- `PATCH /api/v1/clinic-owner/doctors/{pk}/` — clinic_owner.
- `GET /api/v1/clinic-owner/schedule/` — clinic_owner.
- `GET /api/v1/clinic-owner/services/` — clinic_owner.
- `PATCH /api/v1/clinic-owner/services/` — clinic_owner.

## Clinics

- `GET /api/clinics/` — Public.
- `GET /api/clinics/emergency/` — Public.
- `GET /api/clinics/nearby/` — Public.
- `GET /api/clinics/{pk}/` — Public.
- `GET /api/v1/clinics/` — Public.
- `GET /api/v1/clinics/emergency/` — Public.
- `GET /api/v1/clinics/nearby/` — Public.
- `GET /api/v1/clinics/{pk}/` — Public.

## Documentation

- `GET /api/docs/` — Public.
- `GET /api/schema/` — Public.

## Doctor Panel

- `GET /api/doctor-panel/analytics/` — doctor.
- `GET /api/doctor-panel/appointments/` — doctor.
- `GET /api/doctor-panel/appointments/{pk}/` — doctor.
- `POST /api/doctor-panel/appointments/{pk}/accept/` — doctor.
- `POST /api/doctor-panel/appointments/{pk}/cancel/` — doctor.
- `POST /api/doctor-panel/appointments/{pk}/complete/` — doctor.
- `POST /api/doctor-panel/appointments/{pk}/no-show/` — doctor.
- `POST /api/doctor-panel/appointments/{pk}/reject/` — doctor.
- `POST /api/doctor-panel/appointments/{pk}/reschedule/` — doctor.
- `POST /api/doctor-panel/appointments/{pk}/start/` — doctor.
- `POST /api/doctor-panel/appointments/{pk}/waiting/` — doctor.
- `POST /api/doctor-panel/availability/toggle/` — doctor.
- `GET /api/doctor-panel/blocked-times/` — doctor.
- `POST /api/doctor-panel/blocked-times/` — doctor.
- `DELETE /api/doctor-panel/blocked-times/{pk}/` — doctor.
- `GET /api/doctor-panel/breaks/` — doctor.
- `POST /api/doctor-panel/breaks/` — doctor.
- `DELETE /api/doctor-panel/breaks/{pk}/` — doctor.
- `GET /api/doctor-panel/clinics/` — doctor.
- `GET /api/doctor-panel/dashboard/` — doctor.
- `GET /api/doctor-panel/patients/` — doctor.
- `GET /api/doctor-panel/patients/{pk}/` — doctor.
- `GET /api/doctor-panel/profile/` — doctor.
- `PATCH /api/doctor-panel/profile/` — doctor.
- `GET /api/doctor-panel/profile/preview/` — doctor.
- `GET /api/doctor-panel/schedule/` — doctor.
- `PATCH /api/doctor-panel/schedule/` — doctor.
- `GET /api/v1/doctor-panel/analytics/` — doctor.
- `GET /api/v1/doctor-panel/appointments/` — doctor.
- `GET /api/v1/doctor-panel/appointments/{pk}/` — doctor.
- `POST /api/v1/doctor-panel/appointments/{pk}/accept/` — doctor.
- `POST /api/v1/doctor-panel/appointments/{pk}/cancel/` — doctor.
- `POST /api/v1/doctor-panel/appointments/{pk}/complete/` — doctor.
- `POST /api/v1/doctor-panel/appointments/{pk}/no-show/` — doctor.
- `POST /api/v1/doctor-panel/appointments/{pk}/reject/` — doctor.
- `POST /api/v1/doctor-panel/appointments/{pk}/reschedule/` — doctor.
- `POST /api/v1/doctor-panel/appointments/{pk}/start/` — doctor.
- `POST /api/v1/doctor-panel/appointments/{pk}/waiting/` — doctor.
- `POST /api/v1/doctor-panel/availability/toggle/` — doctor.
- `GET /api/v1/doctor-panel/blocked-times/` — doctor.
- `POST /api/v1/doctor-panel/blocked-times/` — doctor.
- `DELETE /api/v1/doctor-panel/blocked-times/{pk}/` — doctor.
- `GET /api/v1/doctor-panel/breaks/` — doctor.
- `POST /api/v1/doctor-panel/breaks/` — doctor.
- `DELETE /api/v1/doctor-panel/breaks/{pk}/` — doctor.
- `GET /api/v1/doctor-panel/clinics/` — doctor.
- `GET /api/v1/doctor-panel/dashboard/` — doctor.
- `GET /api/v1/doctor-panel/patients/` — doctor.
- `GET /api/v1/doctor-panel/patients/{pk}/` — doctor.
- `GET /api/v1/doctor-panel/profile/` — doctor.
- `PATCH /api/v1/doctor-panel/profile/` — doctor.
- `GET /api/v1/doctor-panel/profile/preview/` — doctor.
- `GET /api/v1/doctor-panel/schedule/` — doctor.
- `PATCH /api/v1/doctor-panel/schedule/` — doctor.

## Doctors

- `GET /api/doctors/` — Public.
- `GET /api/doctors/nearby/` — Public.
- `GET /api/doctors/{pk}/` — Public.
- `GET /api/v1/doctors/` — Public.
- `GET /api/v1/doctors/nearby/` — Public.
- `GET /api/v1/doctors/{pk}/` — Public.

## Availability

- `GET /api/doctors/{pk}/availability/` — Public.
- `GET /api/v1/doctors/{pk}/availability/` — Public.

## Favorites

- `GET /api/favorites/clinics/` — patient.
- `DELETE /api/favorites/clinics/{pk}/` — patient.
- `POST /api/favorites/clinics/{pk}/` — patient.
- `GET /api/favorites/doctors/` — patient.
- `DELETE /api/favorites/doctors/{pk}/` — patient.
- `POST /api/favorites/doctors/{pk}/` — patient.
- `GET /api/v1/favorites/clinics/` — patient.
- `DELETE /api/v1/favorites/clinics/{pk}/` — patient.
- `POST /api/v1/favorites/clinics/{pk}/` — patient.
- `GET /api/v1/favorites/doctors/` — patient.
- `DELETE /api/v1/favorites/doctors/{pk}/` — patient.
- `POST /api/v1/favorites/doctors/{pk}/` — patient.

## Notifications

- `GET /api/notifications/` — patient, doctor, clinic_owner, admin, super_admin.
- `POST /api/notifications/read-all/` — patient, doctor, clinic_owner, admin, super_admin.
- `GET /api/notifications/{pk}/` — patient, doctor, clinic_owner, admin, super_admin.
- `POST /api/notifications/{pk}/read/` — patient, doctor, clinic_owner, admin, super_admin.
- `GET /api/v1/notifications/` — patient, doctor, clinic_owner, admin, super_admin.
- `POST /api/v1/notifications/read-all/` — patient, doctor, clinic_owner, admin, super_admin.
- `GET /api/v1/notifications/{pk}/` — patient, doctor, clinic_owner, admin, super_admin.
- `POST /api/v1/notifications/{pk}/read/` — patient, doctor, clinic_owner, admin, super_admin.

## Patient

- `GET /api/profile/` — patient, doctor, clinic_owner, admin, super_admin.
- `PATCH /api/profile/` — patient, doctor, clinic_owner, admin, super_admin.
- `GET /api/search/` — Public.
- `GET /api/services/` — Public.
- `GET /api/services/{pk}/` — Public.
- `GET /api/specialties/` — Public.
- `GET /api/specialties/{pk}/` — Public.
- `GET /api/v1/profile/` — patient, doctor, clinic_owner, admin, super_admin.
- `PATCH /api/v1/profile/` — patient, doctor, clinic_owner, admin, super_admin.
- `GET /api/v1/search/` — Public.
- `GET /api/v1/services/` — Public.
- `GET /api/v1/services/{pk}/` — Public.
- `GET /api/v1/specialties/` — Public.
- `GET /api/v1/specialties/{pk}/` — Public.
- `GET /api/v1/waitlists/` — patient.
- `POST /api/v1/waitlists/` — patient.
- `GET /api/v1/waitlists/{pk}/` — patient.
- `POST /api/v1/waitlists/{pk}/cancel/` — patient.
- `POST /api/v1/waitlists/{pk}/mark-booked/` — patient.
- `GET /api/waitlists/` — patient.
- `POST /api/waitlists/` — patient.
- `GET /api/waitlists/{pk}/` — patient.
- `POST /api/waitlists/{pk}/cancel/` — patient.
- `POST /api/waitlists/{pk}/mark-booked/` — patient.

## Reviews

- `GET /api/reviews/` — Public.
- `POST /api/reviews/` — patient.
- `GET /api/v1/reviews/` — Public.
- `POST /api/v1/reviews/` — patient.

## Telegram

- `GET /api/telegram/appointments/` — Bot secret + linked patient.
- `POST /api/telegram/appointments/` — Bot secret + linked patient.
- `GET /api/telegram/appointments/by-booking-id/{booking_id}/` — Bot secret + linked patient.
- `GET /api/telegram/appointments/my/` — Bot secret + linked patient.
- `GET /api/telegram/appointments/{pk}/` — Bot secret + linked patient.
- `POST /api/telegram/appointments/{pk}/cancel/` — Bot secret + linked patient.
- `POST /api/telegram/appointments/{pk}/reschedule/` — Bot secret + linked patient.
- `GET /api/telegram/clinics/nearby/` — Public.
- `GET /api/telegram/doctors/{pk}/availability/` — Public.
- `DELETE /api/telegram/link-code/` — patient.
- `POST /api/telegram/link-code/` — patient.
- `POST /api/telegram/link/` — Bot secret + linked patient.
- `GET /api/telegram/search/` — Public.
- `GET /api/v1/telegram/appointments/` — Bot secret + linked patient.
- `POST /api/v1/telegram/appointments/` — Bot secret + linked patient.
- `GET /api/v1/telegram/appointments/by-booking-id/{booking_id}/` — Bot secret + linked patient.
- `GET /api/v1/telegram/appointments/my/` — Bot secret + linked patient.
- `GET /api/v1/telegram/appointments/{pk}/` — Bot secret + linked patient.
- `POST /api/v1/telegram/appointments/{pk}/cancel/` — Bot secret + linked patient.
- `POST /api/v1/telegram/appointments/{pk}/reschedule/` — Bot secret + linked patient.
- `GET /api/v1/telegram/clinics/nearby/` — Public.
- `GET /api/v1/telegram/doctors/{pk}/availability/` — Public.
- `DELETE /api/v1/telegram/link-code/` — patient.
- `POST /api/v1/telegram/link-code/` — patient.
- `POST /api/v1/telegram/link/` — Bot secret + linked patient.
- `GET /api/v1/telegram/search/` — Public.

## Infrastructure and navigation

- `GET /health/` — database readiness; 200 or sanitized 503.
- `/admin/` — Django session-based administration; not a JWT API.
- `GET /api/`, `/api/doctor-panel/`, `/api/admin-panel/`, `/api/clinic-owner/`, `/api/telegram/` — DRF router navigation roots, no business data.

The clinic owner doctor detail ID is the DoctorClinic affiliation ID, not DoctorProfile ID. Use `affiliation_id` there.
