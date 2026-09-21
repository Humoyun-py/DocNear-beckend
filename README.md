# DocNear

## Overview

DocNear is a healthcare discovery and appointment platform. One Django REST API
serves patient, doctor, administrator, clinic-owner, Flutter, and Telegram
clients. Production authentication uses phone OTP with JWT access and refresh
tokens.

## Architecture

The backend owns identity, authorization, appointments, catalog data, OTPs, and
Telegram handoff state. Every client consumes the versioned `/api/v1/` API;
PostgreSQL stores durable data and Redis backs shared throttling and transient
state.

## Tech Stack

- Django, Django REST Framework, PostgreSQL, Redis, Simple JWT, Gunicorn
- React, TypeScript, Vite, Axios
- Flutter and Android/iOS platform projects
- Docker Compose, Render, Netlify, GitHub Actions

## Repository Structure

```text
backend/              Django API, apps, migrations, QA and tests
web/patient/          Patient React application
web/doctor/           Doctor React panel
web/admin/            Administrator React panel
web/clinic-owner/     Clinic-owner React panel
mobile/flutter/       Flutter mobile application
deploy/               Gunicorn, Nginx, Render and systemd configuration
scripts/              Local, QA and deployment helpers
docs/                 Architecture, API, deployment, security and QA guidance
postman/              API collection and example environments
```

## Local Development

Create `.runtime/local.env` from `.env.example`, use development-only values,
install backend and client dependencies, then run:

```bash
DOCNEAR_ENV_FILE=.runtime/local.env ./run-docnear-dev.sh
```

The API listens on `127.0.0.1:8001`; patient, doctor, admin, and owner clients
listen on ports 3001 through 3004. See [local running guidance](docs/RUNNING.md).

## Backend

```bash
python backend/manage.py check --settings=config.settings.development
python backend/manage.py migrate --settings=config.settings.development
```

Production uses `config.settings.production`, requires explicit HTTPS origins,
hosts, PostgreSQL, Redis, and SMS settings, and rejects `DEBUG=true`.

## Patient Web

Build from `web/patient` with `VITE_API_BASE_URL` set to the HTTPS API URL.

## Doctor Panel

Build from `web/doctor`. Authentication, appointments, profile, and schedule
data come from the shared API.

## Admin Panel

Build from `web/admin`. Backend role permissions remain authoritative for all
administrative resources.

## Clinic Owner Panel

Build from `web/clinic-owner`. Clinic ownership and affiliation checks are
enforced by the API.

## Flutter

The package ID remains `com.docnear.app`. Release builds require an HTTPS URL:

```bash
cd mobile/flutter
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://API_DOMAIN/api/v1/
```

## Telegram

Web and mobile request a backend-generated Telegram handoff URL. The private bot
validates that a shared contact belongs to its sender, links the normalized
phone, and asks the backend to send the appropriate login or registration OTP.
Raw handoff tokens and OTP values are never stored or logged.

## Tests

Backend validation uses Django checks, migration drift checks, Ruff, and Pytest.
Each web app runs its TypeScript lint/build and dependency audit. Flutter runs
`flutter analyze`, `flutter test`, and an Android debug build.

## CI

`.github/workflows/ci.yml` runs the required jobs `Backend`, `Patient web`,
`Doctor panel`, `Admin panel`, `Clinic owner panel`, and `Flutter mobile`.

## Deployment

The root `render.yaml` defines the `docnear-api` Render Blueprint. Each web app
contains its own `netlify.toml` with a `dist` publish directory and SPA fallback.
See [deployment guidance](docs/DEPLOYMENT.md) and
[server preparation](docs/SERVER-PREPARATION.md).

## Security

Never commit `.env` files, tokens, passwords, signing keys, media, or runtime
artifacts. Configure secrets in the deployment provider, keep client API URLs
HTTPS in production, and review [security guidance](docs/security/SECRETS.md).
