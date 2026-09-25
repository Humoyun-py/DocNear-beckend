#!/usr/bin/env bash
set -euo pipefail

echo "Checking Django configuration..."
python manage.py check --deploy

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application --config /app/deploy/gunicorn.conf.py
