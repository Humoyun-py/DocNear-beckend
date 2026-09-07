# DocNear observed permission matrix

Source: pytest JUnit report, 2026-09-07. Each API method is exercised with anonymous access and real JWTs for patient, doctor, clinic owner, admin, and super admin.

**Interpretation:** these are role-boundary probes. Authorized writes use empty input and detail probes use a deliberately missing record ID, so 400/404 indicate validation or object scope, not a broken endpoint. Successful business flows are tested separately. Expected denial: anonymous 401; wrong role 403. Bot endpoints require a separate secret and a linked patient, even when a JWT is supplied.

**Super admin scope:** platform-wide access is via admin endpoints. Personal patient, doctor and owner URLs remain role-scoped; blanket impersonation is not implemented. This is a documented discrepancy with the prompt’s literal “access everything” wording.

1026 observed probes across 171 business API operations. Swagger and OpenAPI are documentation endpoints and are tested separately.

## GET /api/admin-panel/admin-users/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/admin-panel/admin-users/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 400; expected allowed; passed.

## GET /api/admin-panel/admin-users/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 404; expected allowed; passed.

## PATCH /api/admin-panel/admin-users/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/admin-users/{pk}/disable/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/admin-users/{pk}/enable/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/affiliations/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/admin-panel/affiliations/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## DELETE /api/admin-panel/affiliations/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/affiliations/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## PATCH /api/admin-panel/affiliations/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/analytics/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/admin-panel/appointments/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/admin-panel/appointments/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## PATCH /api/admin-panel/appointments/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/appointments/{pk}/cancel/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/appointments/{pk}/reschedule/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/clinic-images/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/admin-panel/clinic-images/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## DELETE /api/admin-panel/clinic-images/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/clinic-images/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## PATCH /api/admin-panel/clinic-images/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/clinics/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/admin-panel/clinics/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## DELETE /api/admin-panel/clinics/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/clinics/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## PATCH /api/admin-panel/clinics/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/clinics/{pk}/disable/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/clinics/{pk}/enable/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/clinics/{pk}/mark-partner/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/clinics/{pk}/remove-partner/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/clinics/{pk}/verify/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/dashboard/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/admin-panel/doctors/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/admin-panel/doctors/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## DELETE /api/admin-panel/doctors/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/doctors/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## PATCH /api/admin-panel/doctors/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/doctors/{pk}/activate/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/doctors/{pk}/suspend/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/doctors/{pk}/verify/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/logs/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/admin-panel/logs/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/notifications/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/admin-panel/notifications/broadcast/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## POST /api/admin-panel/notifications/send/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## GET /api/admin-panel/notifications/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/owners/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/admin-panel/owners/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## GET /api/admin-panel/owners/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## PATCH /api/admin-panel/owners/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/owners/{pk}/disable/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/owners/{pk}/enable/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/patients/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/admin-panel/patients/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## PATCH /api/admin-panel/patients/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/patients/{pk}/disable/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/patients/{pk}/enable/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/reviews/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## DELETE /api/admin-panel/reviews/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/reviews/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/reviews/{pk}/approve/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/admin-panel/reviews/{pk}/hide/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/services/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/admin-panel/services/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## DELETE /api/admin-panel/services/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/services/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## PATCH /api/admin-panel/services/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/settings/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 200; expected allowed; passed.

## PATCH /api/admin-panel/settings/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/admin-panel/specialties/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/admin-panel/specialties/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## DELETE /api/admin-panel/specialties/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/admin-panel/specialties/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## PATCH /api/admin-panel/specialties/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/appointments/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/appointments/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/appointments/my/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/appointments/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/appointments/{pk}/cancel/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/appointments/{pk}/reschedule/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/auth/change-password/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## POST /api/auth/forgot-password/

- anonymous: HTTP 400; expected allowed; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## POST /api/auth/login/

- anonymous: HTTP 400; expected allowed; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## POST /api/auth/logout/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## GET /api/auth/me/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## PATCH /api/auth/me/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/auth/register/

- anonymous: HTTP 400; expected allowed; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## POST /api/auth/reset-password/

- anonymous: HTTP 400; expected allowed; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## POST /api/auth/token/refresh/

- anonymous: HTTP 400; expected allowed; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## GET /api/clinic-owner/analytics/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/clinic-owner/appointments/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/clinic-owner/appointments/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/clinic-owner/clinic/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## PATCH /api/clinic-owner/clinic/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/clinic-owner/clinics/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/clinic-owner/dashboard/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/clinic-owner/doctors/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/clinic-owner/doctors/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/clinic-owner/doctors/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## PATCH /api/clinic-owner/doctors/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/clinic-owner/schedule/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/clinic-owner/services/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## PATCH /api/clinic-owner/services/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/clinics/

- anonymous: HTTP 200; expected allowed; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/clinics/emergency/

- anonymous: HTTP 200; expected allowed; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/clinics/nearby/

- anonymous: HTTP 400; expected allowed; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## GET /api/clinics/{pk}/

- anonymous: HTTP 404; expected allowed; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/doctor-panel/analytics/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/appointments/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/appointments/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/appointments/{pk}/accept/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/appointments/{pk}/cancel/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/appointments/{pk}/complete/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/appointments/{pk}/no-show/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/appointments/{pk}/reject/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/appointments/{pk}/reschedule/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/appointments/{pk}/start/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/appointments/{pk}/waiting/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/availability/toggle/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/blocked-times/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/blocked-times/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## DELETE /api/doctor-panel/blocked-times/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/breaks/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/doctor-panel/breaks/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## DELETE /api/doctor-panel/breaks/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/clinics/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/dashboard/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/patients/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/patients/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/profile/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## PATCH /api/doctor-panel/profile/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/profile/preview/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctor-panel/schedule/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## PATCH /api/doctor-panel/schedule/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 403; expected denied; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/doctors/

- anonymous: HTTP 200; expected allowed; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/doctors/nearby/

- anonymous: HTTP 400; expected allowed; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## GET /api/doctors/{pk}/

- anonymous: HTTP 404; expected allowed; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/doctors/{pk}/availability/

- anonymous: HTTP 404; expected allowed; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/favorites/clinics/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## DELETE /api/favorites/clinics/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 204; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/favorites/clinics/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/favorites/doctors/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## DELETE /api/favorites/doctors/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 204; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/favorites/doctors/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/notifications/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/notifications/read-all/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/notifications/{pk}/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## POST /api/notifications/{pk}/read/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/profile/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## PATCH /api/profile/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/reviews/

- anonymous: HTTP 200; expected allowed; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## POST /api/reviews/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## GET /api/search/

- anonymous: HTTP 200; expected allowed; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/services/

- anonymous: HTTP 200; expected allowed; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/services/{pk}/

- anonymous: HTTP 404; expected allowed; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/specialties/

- anonymous: HTTP 200; expected allowed; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

## GET /api/specialties/{pk}/

- anonymous: HTTP 404; expected allowed; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## GET /api/telegram/appointments/

- anonymous: HTTP 401; expected bot credentials; passed.
- patient: HTTP 401; expected bot credentials; passed.
- doctor: HTTP 401; expected bot credentials; passed.
- clinic_owner: HTTP 401; expected bot credentials; passed.
- admin: HTTP 401; expected bot credentials; passed.
- super_admin: HTTP 401; expected bot credentials; passed.

## POST /api/telegram/appointments/

- anonymous: HTTP 401; expected bot credentials; passed.
- patient: HTTP 401; expected bot credentials; passed.
- doctor: HTTP 401; expected bot credentials; passed.
- clinic_owner: HTTP 401; expected bot credentials; passed.
- admin: HTTP 401; expected bot credentials; passed.
- super_admin: HTTP 401; expected bot credentials; passed.

## GET /api/telegram/appointments/by-booking-id/{booking_id}/

- anonymous: HTTP 401; expected bot credentials; passed.
- patient: HTTP 401; expected bot credentials; passed.
- doctor: HTTP 401; expected bot credentials; passed.
- clinic_owner: HTTP 401; expected bot credentials; passed.
- admin: HTTP 401; expected bot credentials; passed.
- super_admin: HTTP 401; expected bot credentials; passed.

## GET /api/telegram/appointments/my/

- anonymous: HTTP 401; expected bot credentials; passed.
- patient: HTTP 401; expected bot credentials; passed.
- doctor: HTTP 401; expected bot credentials; passed.
- clinic_owner: HTTP 401; expected bot credentials; passed.
- admin: HTTP 401; expected bot credentials; passed.
- super_admin: HTTP 401; expected bot credentials; passed.

## GET /api/telegram/appointments/{pk}/

- anonymous: HTTP 401; expected bot credentials; passed.
- patient: HTTP 401; expected bot credentials; passed.
- doctor: HTTP 401; expected bot credentials; passed.
- clinic_owner: HTTP 401; expected bot credentials; passed.
- admin: HTTP 401; expected bot credentials; passed.
- super_admin: HTTP 401; expected bot credentials; passed.

## POST /api/telegram/appointments/{pk}/cancel/

- anonymous: HTTP 401; expected bot credentials; passed.
- patient: HTTP 401; expected bot credentials; passed.
- doctor: HTTP 401; expected bot credentials; passed.
- clinic_owner: HTTP 401; expected bot credentials; passed.
- admin: HTTP 401; expected bot credentials; passed.
- super_admin: HTTP 401; expected bot credentials; passed.

## POST /api/telegram/appointments/{pk}/reschedule/

- anonymous: HTTP 401; expected bot credentials; passed.
- patient: HTTP 401; expected bot credentials; passed.
- doctor: HTTP 401; expected bot credentials; passed.
- clinic_owner: HTTP 401; expected bot credentials; passed.
- admin: HTTP 401; expected bot credentials; passed.
- super_admin: HTTP 401; expected bot credentials; passed.

## GET /api/telegram/clinics/nearby/

- anonymous: HTTP 400; expected allowed; passed.
- patient: HTTP 400; expected allowed; passed.
- doctor: HTTP 400; expected allowed; passed.
- clinic_owner: HTTP 400; expected allowed; passed.
- admin: HTTP 400; expected allowed; passed.
- super_admin: HTTP 400; expected allowed; passed.

## GET /api/telegram/doctors/{pk}/availability/

- anonymous: HTTP 404; expected allowed; passed.
- patient: HTTP 404; expected allowed; passed.
- doctor: HTTP 404; expected allowed; passed.
- clinic_owner: HTTP 404; expected allowed; passed.
- admin: HTTP 404; expected allowed; passed.
- super_admin: HTTP 404; expected allowed; passed.

## DELETE /api/telegram/link-code/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 204; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/telegram/link-code/

- anonymous: HTTP 401; expected denied; passed.
- patient: HTTP 201; expected allowed; passed.
- doctor: HTTP 403; expected denied; passed.
- clinic_owner: HTTP 403; expected denied; passed.
- admin: HTTP 403; expected denied; passed.
- super_admin: HTTP 403; expected denied; passed.

## POST /api/telegram/link/

- anonymous: HTTP 403; expected bot credentials; passed.
- patient: HTTP 403; expected bot credentials; passed.
- doctor: HTTP 403; expected bot credentials; passed.
- clinic_owner: HTTP 403; expected bot credentials; passed.
- admin: HTTP 403; expected bot credentials; passed.
- super_admin: HTTP 403; expected bot credentials; passed.

## GET /api/telegram/search/

- anonymous: HTTP 200; expected allowed; passed.
- patient: HTTP 200; expected allowed; passed.
- doctor: HTTP 200; expected allowed; passed.
- clinic_owner: HTTP 200; expected allowed; passed.
- admin: HTTP 200; expected allowed; passed.
- super_admin: HTTP 200; expected allowed; passed.

