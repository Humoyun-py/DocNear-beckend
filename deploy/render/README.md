# Render deployment

Render uses the repository-root `render.yaml` by default. The Blueprint builds
the root `Dockerfile`, runs migrations as a pre-deploy command, binds Gunicorn
to Render's `PORT`, and checks `/health/`.

Set every `sync: false` value in the Render dashboard. Never commit production
credentials. Enable Telegram only after adding its token, username, and webhook
secret. The service is configured for the `main` branch but this repository
refactor must be reviewed and merged before any deployment is started.
