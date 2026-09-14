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
