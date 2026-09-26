import os
import logging
import subprocess
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from django.db import close_old_connections
from django.test import RequestFactory
from rest_framework.test import APIClient

from apps.accounts.models import PhoneOTP, User
from apps.accounts.otp import client_ip, request_code, OtpRateLimited
from apps.telegram_support.bot import DocNearTelegramBot
from apps.telegram_support.models import TelegramPhoneLink
from .test_telegram_bot import FakeTelegram, FakeBackend, update
from .conftest import payload


@pytest.fixture
def security_logs(caplog):
    logger = logging.getLogger('docnear.security')
    logger.addHandler(caplog.handler)
    caplog.set_level(logging.WARNING, logger='docnear.security')
    yield caplog
    logger.removeHandler(caplog.handler)


def test_forwarded_header_does_not_override_direct_peer(settings):
    settings.REST_FRAMEWORK = {**settings.REST_FRAMEWORK, 'NUM_PROXIES': 0}
    request = RequestFactory().get('/', REMOTE_ADDR='127.0.0.1', HTTP_X_FORWARDED_FOR='192.0.2.1')
    assert client_ip(request) == '127.0.0.1'


@pytest.mark.django_db
def test_spoofed_ip_cannot_bypass_otp_quota(settings):
    settings.OTP_IP_REQUEST_LIMIT = 1
    client = APIClient()
    for index, expected in [(1, 200), (2, 429)]:
        response = client.post('/api/v1/auth/request-otp/', {
            'phone_number': f'+99890000000{index}', 'purpose': 'register', 'channel': 'sms',
        }, HTTP_X_FORWARDED_FOR=f'192.0.2.{index}')
        assert response.status_code == expected


@pytest.mark.django_db
def test_security_log_masks_otp_attack_data(settings, security_logs):
    settings.OTP_PHONE_REQUEST_LIMIT = 1
    phone = '+998900000096'
    client = APIClient()
    body = {'phone_number': phone, 'purpose': 'register', 'channel': 'sms'}
    assert client.post('/api/v1/auth/request-otp/', body).status_code == 200
    assert client.post('/api/v1/auth/request-otp/', body).status_code == 429
    assert client.post('/api/v1/auth/verify-otp/', {**body, 'code': '000000'}).status_code == 400
    log = "\n".join(record.getMessage() for record in security_logs.records if record.name == 'docnear.security')
    assert 'event=otp_request_rate_limited' in log
    assert 'event=otp_verification_failed' in log
    assert '+99890****096' in log
    for secret in [phone, '000000', 'Authorization', 'refresh', 'password']:
        assert secret not in log


@pytest.mark.django_db
def test_security_log_traces_role_idor_auth_conflict_and_page_abuse(client, world, security_logs):
    client.credentials(HTTP_AUTHORIZATION='Bearer invalid-secret-token')
    assert client.get('/api/v1/auth/me/').status_code == 401
    client.credentials()
    assert client.post('/api/v1/auth/token/refresh/', {'refresh': 'invalid-refresh-token'}).status_code == 401
    client.force_authenticate(world.patient)
    appointment = client.post('/api/v1/appointments/', payload(world)).json()['data']
    assert client.get('/api/v1/admin-panel/appointments/').status_code == 403
    assert client.get('/api/v1/clinics/', {'page_size': 100000}).status_code == 200
    client.force_authenticate(world.other)
    assert client.get(f"/api/v1/appointments/{appointment['id']}/").status_code == 404
    client.force_authenticate(world.patient)
    assert client.post('/api/v1/appointments/', payload(world)).status_code == 409
    log = "\n".join(record.getMessage() for record in security_logs.records if record.name == 'docnear.security')
    for event in [
        'authentication_failed', 'token_refresh_failed', 'authorization_denied', 'page_size_capped',
        'object_scope_denied', 'booking_or_state_conflict',
    ]:
        assert f'event={event}' in log
    assert 'invalid-secret-token' not in log
    assert 'invalid-refresh-token' not in log
    assert f"appointments/{appointment['id']}" not in log
    assert 'route=api/v1/appointments/(?P<pk>[^/.]+)/$' in log


@pytest.mark.django_db
@pytest.mark.parametrize('role', ['doctor', 'clinic_owner', 'admin', 'super_admin'])
def test_registration_does_not_activate_unverified_staff(role):
    user = User.objects.create_user(phone_number='+998900000099', role=role, first_name='Security test', is_verified=False, is_active=False)
    client = APIClient()
    body = {'phone_number': user.phone_number, 'purpose': 'register', 'channel': 'sms'}
    assert client.post('/api/v1/auth/request-otp/', body).status_code == 200
    assert client.post('/api/v1/auth/verify-otp/', {**body, 'code': '111111'}).status_code == 400
    user.refresh_from_db()
    assert not user.is_active and not user.is_verified


@pytest.mark.django_db(transaction=True)
def test_concurrent_otp_requests_respect_quota(settings):
    settings.OTP_PHONE_REQUEST_LIMIT = 1
    barrier = Barrier(2)

    def send():
        close_old_connections()
        try:
            barrier.wait(timeout=5)
            request_code(request=RequestFactory().post('/'), phone_number='+998900000098', purpose='register', channel='sms')
            return 200
        except OtpRateLimited:
            return 429
        finally:
            close_old_connections()

    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(lambda _: send(), range(2))) == [200, 429]
    assert PhoneOTP.objects.filter(verified_at__isnull=True).count() == 1


def test_bot_ignores_group_contacts_and_nontext_updates():
    telegram, backend = FakeTelegram(), FakeBackend()
    bot = DocNearTelegramBot(telegram, backend)
    bot.handle_update(update())
    bot.handle_update(update('/code', chat=-202))
    bot.handle_update(update(contact={'user_id': 101, 'phone_number': '+998900000099'}, chat=-202))
    assert not telegram.sent and not backend.linked and not backend.codes


@pytest.mark.django_db
def test_backend_rejects_group_phone_link(settings):
    settings.TELEGRAM_BOT_SECRET = 'test-only'
    response = APIClient().post('/api/v1/telegram/phone-link/', {
        'phone_number': '+998900000099', 'telegram_user_id': 101,
        'telegram_chat_id': -202, 'contact_user_id': 101, 'sender_user_id': 101,
    }, HTTP_X_TELEGRAM_BOT_SECRET='test-only')
    assert response.status_code == 400


@pytest.mark.django_db
def test_legacy_group_link_cannot_receive_otp(settings, monkeypatch):
    settings.TELEGRAM_OTP_ENABLED = True
    user = User.objects.create_user(phone_number='+998900000097', first_name='Test', is_verified=True)
    TelegramPhoneLink.objects.create(user=user, phone_number=user.phone_number, telegram_user_id=101, telegram_chat_id=-202)
    def unexpected_send(*args):
        pytest.fail('Delivery must not be attempted')
    monkeypatch.setattr('apps.accounts.otp.send_telegram_code', unexpected_send)
    response = APIClient().post('/api/v1/auth/request-otp/', {
        'phone_number': user.phone_number, 'purpose': 'login', 'channel': 'telegram',
    })
    assert response.status_code == 400
    assert not PhoneOTP.objects.exists()


@pytest.mark.parametrize('override', [
    {}, {'SECRET_KEY': 'a' * 60}, {'SECRET_KEY': 'development-only-change-this-before-deploying-docnear'},
    {'ALLOWED_HOSTS': '*'}, {'ALLOWED_HOSTS': ' '}, {'DEBUG': 'true'},
    {'CORS_ALLOWED_ORIGINS': 'https://*'}, {'CORS_ALLOWED_ORIGINS': 'https://example.test/path'},
    {'SMS_API_URL': 'http://sms.example.test/send'}, {'SMS_API_URL': ''}, {'SMS_API_KEY': ''}, {'REDIS_URL': ''},
    {'OTP_SMS_PROVIDER': 'console'}, {'DATABASE_URL': ''}, {'OTP_MAX_ATTEMPTS': '99'},
])
def test_production_configuration_fails_closed(override):
    env = {key: value for key, value in os.environ.items() if key in {'PATH', 'LANG', 'HOME'}}
    env.update({
        'PYTHONPATH': str(Path(__file__).resolve().parents[1]),
        'DJANGO_SETTINGS_MODULE': 'config.settings.production',
        'SECRET_KEY': 'safe-test-fixture-not-for-deployment-1234567890-ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        'DATABASE_URL': 'postgresql://test:test@localhost/test', 'ALLOWED_HOSTS': 'example.test',
        'CORS_ALLOWED_ORIGINS': 'https://example.test', 'REDIS_URL': 'redis://localhost:6379/0',
        'SMS_OTP_ENABLED': 'true', 'OTP_SMS_PROVIDER': 'http', 'SMS_API_URL': 'https://sms.example.test/send', 'SMS_API_KEY': 'test-only',
        'CSRF_TRUSTED_ORIGINS': 'https://example.test',
        'TELEGRAM_BOT_TOKEN': 'dummy-ci-token', 'TELEGRAM_BOT_USERNAME': 'dummy_bot',
        'TELEGRAM_BOT_WEBHOOK_SECRET': 'dummy-ci-secret', 'TELEGRAM_OTP_ENABLED': 'false',
    })
    env.update(override)
    result = subprocess.run([sys.executable, '-c', 'import config.settings.production'], env=env, capture_output=True)
    assert (result.returncode == 0) == (not override)


def test_production_sms_disabled_does_not_require_provider_credentials():
    env = {key: value for key, value in os.environ.items() if key in {"PATH", "LANG", "HOME"}}
    env.update({
        "PYTHONPATH": str(Path(__file__).resolve().parents[1]),
        "DJANGO_SETTINGS_MODULE": "config.settings.production",
        "SECRET_KEY": "safe-test-fixture-not-for-deployment-1234567890-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "DATABASE_URL": "postgresql://test:test@localhost/test",
        "ALLOWED_HOSTS": "example.test",
        "CORS_ALLOWED_ORIGINS": "https://example.test",
        "CSRF_TRUSTED_ORIGINS": "https://example.test",
        "REDIS_URL": "redis://localhost:6379/0",
        "SMS_OTP_ENABLED": "false",
        "TELEGRAM_OTP_ENABLED": "false",
    })

    result = subprocess.run(
        [sys.executable, "-c", "import config.settings.production"],
        env=env, capture_output=True,
    )

    assert result.returncode == 0, result.stderr.decode()
