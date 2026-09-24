# Render deployment

Render uses the repository-root `render.yaml` by default. The Blueprint builds
the root `Dockerfile`, binds Gunicorn to Render's `PORT`, and checks `/health/`.
On startup, `deploy/render/start.sh` runs migrations and `collectstatic` before
replacing itself with Gunicorn. This startup strategy does not depend on the
paid-only Render pre-deploy command and is suitable for a single-instance Free
staging/demo service.

Set every `sync: false` value in the Render dashboard. Never commit production
credentials. Keep Telegram disabled for the Free demo service; the current bot
uses long polling and requires an always-on worker. The service is configured
for the `main` branch.

Use persistent object storage for user-uploaded media. Render's local filesystem
is ephemeral and must not be treated as permanent media storage.
