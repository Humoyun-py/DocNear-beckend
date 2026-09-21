# DocNear Postman API QA

Import `postman/DocNear.postman_collection.json` and the blank
`postman/DocNear.local.postman_environment.json`. The generated collection has
all discovered operations plus a 24-request phone OTP booking acceptance flow.
Never run mutation folders against production.

The runnable folder performs:

1. Request and verify OTP for patient A, patient B, doctor, owner, admin and
   super admin.
2. Find the clinic and a backend-provided free slot.
3. Create a patient appointment and save its Booking ID.
4. Let the doctor accept it.
5. Confirm the patient, admin, owner and super admin see the same status.
6. Confirm patient B receives `409 slot_unavailable` for the same slot.
7. Cancel the QA appointment.

Use only `config.settings.test`, where the deterministic code `111111` is
isolated. The six QA phone numbers are listed in `docs/RUNNING.md`.

The helper prepares an isolated database and writes a private environment under
`.runtime/integration/postman.env.json` with mode `0600`:

```bash
./scripts/run-integration-qa.sh
```

Leave that server running, then in another terminal:

```bash
newman run postman/DocNear.postman_collection.json   -e .runtime/integration/postman.env.json   --folder '00 End-to-end booking verification'   --reporters cli,junit   --reporter-junit-export docs/qa/newman-results.xml
```

The committed environment contains blank OTP, JWT and bot-secret values. Never
publish a populated runtime environment. Module folders are request references;
they are not one sequential CRUD scenario.

Regenerate route inventory and Postman files:

```bash
PYTHONPATH=backend DJANGO_SETTINGS_MODULE=config.settings.test   .venv/bin/python -m qa.export_artifacts
```
