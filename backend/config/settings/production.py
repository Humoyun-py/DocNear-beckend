import os
from urllib.parse import urlsplit

from .base import *  # noqa: F403

if (not os.getenv("SECRET_KEY") or len(SECRET_KEY) < 50 or len(set(SECRET_KEY)) < 5  # noqa: F405
        or any(marker in SECRET_KEY.lower() for marker in ("change", "development", "example", "django-insecure", "ci-only"))):  # noqa: F405
    raise ValueError("Production SECRET_KEY must be set and at least 50 characters.")
missing = [name for name in (
    "DATABASE_URL", "ALLOWED_HOSTS", "CORS_ALLOWED_ORIGINS", "CSRF_TRUSTED_ORIGINS",
) if not os.getenv(name)]
if missing:
    raise ValueError(f"Production settings require: {', '.join(missing)}.")
if os.getenv("DEBUG", "false").lower() not in {"false", "0"}:
    raise ValueError("Production DEBUG must be false.")
if any(not host.strip() or "*" in host or "/" in host for host in ALLOWED_HOSTS):  # noqa: F405
    raise ValueError("Production ALLOWED_HOSTS requires explicit hostnames.")
if not REDIS_URL:  # noqa: F405
    raise ValueError("Production requires shared REDIS_URL for throttling.")
if OTP_SMS_PROVIDER != "http":  # noqa: F405
    raise ValueError("Production requires OTP_SMS_PROVIDER=http.")
if not SMS_API_URL or not SMS_API_KEY:  # noqa: F405
    raise ValueError("Production requires SMS_API_URL and SMS_API_KEY.")
sms_url = urlsplit(SMS_API_URL)  # noqa: F405
if sms_url.scheme != "https" or not sms_url.hostname or sms_url.username or sms_url.password:
    raise ValueError("Production SMS_API_URL requires HTTPS without embedded credentials.")
if TELEGRAM_OTP_ENABLED and (not TELEGRAM_BOT_TOKEN or not TELEGRAM_BOT_SECRET):  # noqa: F405
    raise ValueError("Enabled Telegram OTP requires Telegram credentials.")
if LEGACY_PASSWORD_AUTH_ENABLED:  # noqa: F405
    raise ValueError("Legacy password authentication must remain disabled in production.")
insecure_cors_origins = [origin for origin in CORS_ALLOWED_ORIGINS if (  # noqa: F405
    urlsplit(origin).scheme != "https" or not urlsplit(origin).hostname or "*" in origin
    or urlsplit(origin).username or urlsplit(origin).password
    or urlsplit(origin).path or urlsplit(origin).query or urlsplit(origin).fragment
)]
if insecure_cors_origins:
    raise ValueError("Production CORS_ALLOWED_ORIGINS must contain only HTTPS origins.")
insecure_csrf_origins = [origin for origin in CSRF_TRUSTED_ORIGINS if (  # noqa: F405
    urlsplit(origin).scheme != "https" or not urlsplit(origin).hostname or "*" in origin
    or urlsplit(origin).username or urlsplit(origin).password
    or urlsplit(origin).path or urlsplit(origin).query or urlsplit(origin).fragment
)]
if insecure_csrf_origins:
    raise ValueError("Production CSRF_TRUSTED_ORIGINS must contain only HTTPS origins.")
if not 1 <= OTP_MAX_ATTEMPTS <= 5 or not 1 <= OTP_EXPIRE_MINUTES <= 5:  # noqa: F405
    raise ValueError("Production OTP lifetime and attempts must be between 1 and 5.")
if REST_FRAMEWORK["NUM_PROXIES"] < 0:  # noqa: F405
    raise ValueError("TRUSTED_PROXY_COUNT cannot be negative.")
DEBUG = False
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
# Enable only behind a trusted proxy that overwrites this header.
if os.getenv("TRUST_PROXY", "false") == "true":  # noqa: F405
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
