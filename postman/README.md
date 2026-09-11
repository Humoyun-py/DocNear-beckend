# DocNear Postman API QA

Import `DocNear.postman_collection.json` and `DocNear.local.postman_environment.json` into Postman. The collection includes every discovered API operation, grouped by module, plus an **18-request end-to-end booking folder**. Expected response examples are illustrative contracts, not production captures.

## Local setup

Use a disposable PostgreSQL database. The seed command creates fictional accounts, one clinic, one doctor, a specialty, a service and a seven-day working schedule. It never prints passwords or JWTs. Nothing here should be run against production.

From the repository root:

```bash
uv venv .venv
uv pip install --python .venv/bin/python -r backend/requirements-dev.txt
export DATABASE_URL='postgresql://YOUR_USER:YOUR_PASSWORD@127.0.0.1:5432/docnear_qa'
export DJANGO_SETTINGS_MODULE=config.settings.development
export DEBUG=true
.venv/bin/python backend/manage.py migrate
read -rs -p 'QA password (at least 10 characters): ' DOCNEAR_QA_PASSWORD
export DOCNEAR_QA_PASSWORD
.venv/bin/python backend/manage.py seed_qa
.venv/bin/python backend/manage.py runserver 127.0.0.1:8000 --noreload
```

Set the following **local/current** values in your Postman environment:

- `base_url`: server origin without `/api` or a trailing slash.
- `test_password`: the password supplied to `seed_qa`.
- `doctor_id`, `clinic_id`, `patient_id`, `owner_id`, `admin_id`, `specialty_id`, `service_id`, `affiliation_id`: copy the IDs printed by `seed_qa`.
- `date` and `booking_weekday`: copy the seed output, or leave `date` blank so the pre-request script chooses tomorrow in Asia/Tashkent.

The fixture emails are already present in the blank environment. The E2E folder logs in as patient A, patient B, doctor, owner, admin and super admin. It saves their access/refresh tokens locally, chooses a real available slot, verifies shared status, rejects double booking, then cancels its booking.

**Do not publish/export a populated environment:** it contains passwords, JWTs and potentially a Telegram secret. Committed environment and collection files contain only blank credential variables.

## Run the acceptance flow

Run only the folder **00 End-to-end booking verification** in the Collection Runner. Its 18 requests and 47 assertions passed against the local Django server on September 7, 2026. JWT refresh and concurrent transactions are covered separately by pytest.

CLI equivalent:

```bash
newman run postman/DocNear.postman_collection.json \
  -e /path/to/private-environment.json \
  --folder '00 End-to-end booking verification' \
  --reporters cli,junit \
  --reporter-junit-export Docs/qa/newman-results.xml
```

For an entirely local disposable run, `qa.prepare_live` can create the QA fixture data and a private environment automatically:

```bash
DOCNEAR_QA_LIVE=1 DEBUG=true \
  DOCNEAR_QA_BASE_URL=http://127.0.0.1:8001 PYTHONPATH=backend \
  .venv/bin/python -m qa.prepare_live
```

This helper requires a database name ending in `_qa`, writes credentials only to `/tmp/docnear-qa-runtime/postman.env.json` with mode `0600`, and does not print them. Supply `DATABASE_URL` as above. The PostgreSQL user must be able to create the `btree_gist` extension for overlap protection.

## Using the module folders

The module folders are a complete request reference, **not a single executable CRUD workflow**. Pick requests with the correct fixture state. In particular:

- Set detail IDs from the preceding create/list response. IDs for reviews, notifications, breaks, images and logs differ from appointment IDs.
- Clinic owner doctor detail paths use `affiliation_id` (DoctorClinic); public and admin doctor paths use `doctor_id` (DoctorProfile).
- `GET` lists use `data.results`. All JSON successes use `success/data`; errors use `success/code/message/errors`. HTTP 204 has no body.
- Image creation uses multipart form data; select a real image in the `image` field.
- A doctor must confirm a request before starting it. Starting a confirmed appointment performs check-in and records `waiting → in_progress`. Starting early is rejected. A completed appointment cannot be cancelled.
- Reviews require a **completed appointment belonging to that patient**. Create and complete a suitable fixture first; the E2E cleanup booking is cancelled and cannot be reviewed.
- Rescheduling requires a currently free slot. Set `next_time` from the availability response.
- Password reset needs a UID/token from the email backend. These values are never returned by the API. Changing/resetting a password invalidates previous credentials/tokens as tested.
- The generic refresh request assumes the patient session. For another role, refresh that role's token and update both its access and rotated refresh variables. Do not reuse a rotated token.
- Login and password reset share a 10/minute authentication throttle. Repeated Collection Runner runs may return 429 until the window expires.
- Django `/admin/` uses session authentication and is outside this JWT collection.

## Telegram

Set the backend's `TELEGRAM_BOT_SECRET` and the same value as a **secret local environment value**. Authenticate as a patient to create a link code, then redeem it from the bot request. Booking requests need both `X-Telegram-Bot-Secret` and `X-Telegram-User-Id`.

A Booking ID alone never grants access to an appointment. Public search/nearby/availability requests need no bot secret; booking and lookup do. Deleting `/api/telegram/link-code/` unlinks the authenticated patient's Telegram account.

## Regeneration

```bash
PYTHONPATH=backend .venv/bin/python -m qa.export_artifacts
```

This regenerates the committed blank environment, collection and endpoint inventory; it does not overwrite the private `/tmp` environment or call any API.
