# Monitoring and rollback

Probe `GET /health/` every 30 seconds from outside the host and alert on three
failures or a 503. Collect Nginx, Gunicorn, Django and Telegram worker logs in a
central system with access controls and a short retention for request metadata.

Alert on 5xx rate, latency, database connections, disk, Redis availability,
worker restarts, backup age, and the security events documented in
`Docs/security/FORENSIC-LOGGING.md`. Never index Authorization headers, OTPs,
SMS keys, bot tokens or request bodies.

For rollback, stop traffic at Nginx, deploy the previous immutable image or Git
commit, run `check --deploy`, verify migrations are compatible, restart the API
and bot, then smoke-test `/health/`, OTP and a non-destructive authenticated read.
If a migration is not backward-compatible, restore the pre-release backup in an
isolated database first and use the incident runbook; do not improvise destructive
SQL on the production database.
