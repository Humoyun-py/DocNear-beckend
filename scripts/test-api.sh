#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${DATABASE_URL:?Set DATABASE_URL to an isolated PostgreSQL QA database.}"
export DJANGO_SETTINGS_MODULE=config.settings.test
.venv/bin/python backend/manage.py check
.venv/bin/pytest -q --tb=short --junitxml=Docs/qa/pytest-results.xml -o junit_family=legacy
PYTHONPATH=backend .venv/bin/python -m qa.summarize_results Docs/qa/pytest-results.xml
