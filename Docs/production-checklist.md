# Production checklist

- [ ] PostgreSQL 16 is private, encrypted, backed up and monitored.
- [ ] Redis is private and shared by every API replica.
- [ ] `.env.production` is in a secret manager, mode `0600`, outside Git.
- [ ] `SECRET_KEY`, database, SMS and Telegram values are unique production values.
- [ ] `DEBUG=false`, explicit hosts, HTTPS CORS and CSRF origins pass `check --deploy`.
- [ ] Nginx terminates HTTPS, sends `X-Forwarded-Proto`, and backend port is private.
- [ ] `TRUSTED_PROXY_COUNT` equals the real proxy chain; direct backend access is blocked.
- [ ] `migrate` and `collectstatic` ran from the release artifact.
- [ ] Static and media volumes/provider have retention and restore tests.
- [ ] Real SMS staging delivery and Telegram private-chat OTP flow passed.
- [ ] Four web panels and signed Flutter AAB use the production HTTPS API.
- [ ] Superuser was created through a controlled shell session, never in an image.
- [ ] Logs redact tokens, OTPs, phone numbers and request bodies; alerts are configured.
- [ ] Backup restore and rollback were rehearsed before traffic cutover.

## Before production, staging must pass

- [ ] Backend health endpoint returns 200.
- [ ] Patient, doctor, admin and clinic-owner panels open over HTTPS.
- [ ] Phone OTP request, verification, expiry and rate limits work with staging credentials.
- [ ] The staging Telegram bot links a private chat and delivers an OTP.
- [ ] Patient booking flow and duplicate-slot conflict work.
- [ ] Admin, doctor and clinic-owner approval/status flows work.
- [ ] Backup and restore were tested in an isolated staging database.
- [ ] Logs contain no secrets, OTPs, tokens, full phone numbers or request bodies.
- [ ] HTTPS certificates, redirects and security headers work.
- [ ] Flutter mobile smoke test passed on a real device against the staging HTTPS API.
