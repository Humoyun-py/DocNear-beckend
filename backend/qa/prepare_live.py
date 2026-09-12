"""Prepare an isolated local QA DB and a private Newman environment.

Explicit opt-in: DOCNEAR_QA_LIVE=1. Requires a non-production DATABASE_URL.
Never prints tokens or OTP codes. Runtime values are stored only in the selected directory, mode 0600.
"""
import io
import json
import os
from pathlib import Path

if os.getenv('DOCNEAR_QA_LIVE') != '1':
    raise SystemExit('Set DOCNEAR_QA_LIVE=1 to opt into local fixture creation.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings.test')
import django
django.setup()
from django.core.management import call_command  # noqa: E402 — Django must be initialized before these imports.
from django.conf import settings  # noqa: E402 — Django must be initialized before these imports.
if not settings.DEBUG or not settings.OTP_TEST_MODE or not settings.DATABASES['default']['NAME'].endswith('_qa'):
    raise SystemExit('Use test settings and a database whose name ends with _qa.')
ROOT = Path(__file__).resolve().parents[2]
directory = Path(os.getenv('DOCNEAR_QA_RUNTIME_DIR', '/tmp/docnear-qa-runtime'))
directory.mkdir(mode=0o700, exist_ok=True)
env_path = directory/'postman.env.json'
environment = json.loads((ROOT/'postman/DocNear.local.postman_environment.json').read_text())
values = {item['key']: item['value'] for item in environment['values']}
call_command('migrate', interactive=False, verbosity=0)
stream = io.StringIO()
call_command('seed_qa', stdout=stream)
fixture = json.loads(stream.getvalue())
values.update({k:v for k,v in fixture.items() if k != 'accounts'})
values.update(
    base_url=os.getenv("DOCNEAR_QA_BASE_URL", "http://127.0.0.1:8001"),
    otp_test_code=settings.OTP_TEST_CODE,
    telegram_bot_secret=os.getenv("TELEGRAM_BOT_SECRET", ""),
)
for item in environment['values']:
    item['value'] = str(values[item['key']])
fd = os.open(env_path, os.O_CREAT | os.O_TRUNC | os.O_WRONLY, 0o600)
with os.fdopen(fd, 'w') as file:
    json.dump(environment, file)
print(f'Local QA fixtures ready; private Newman environment: {env_path}')
