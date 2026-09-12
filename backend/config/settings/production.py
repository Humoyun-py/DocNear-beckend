import os

from .base import *  # noqa: F403

if not os.getenv("SECRET_KEY") or len(SECRET_KEY) < 50:  # noqa: F405
    raise ValueError("Production SECRET_KEY must be set and at least 50 characters.")
missing = [name for name in ("DATABASE_URL", "ALLOWED_HOSTS", "CORS_ALLOWED_ORIGINS") if not os.getenv(name)]
if missing:
    raise ValueError(f"Production settings require: {', '.join(missing)}.")
if OTP_SMS_PROVIDER != "http":  # noqa: F405
    raise ValueError("Production requires OTP_SMS_PROVIDER=http.")
if not SMS_API_URL or not SMS_API_KEY:  # noqa: F405
    raise ValueError("Production requires SMS_API_URL and SMS_API_KEY.")
if not TELEGRAM_BOT_TOKEN or not TELEGRAM_BOT_SECRET:  # noqa: F405
    raise ValueError("Production requires TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_SECRET.")
if LEGACY_PASSWORD_AUTH_ENABLED:  # noqa: F405
    raise ValueError("Legacy password authentication must remain disabled in production.")
insecure_cors_origins = [origin for origin in CORS_ALLOWED_ORIGINS if not origin.startswith("https://")]  # noqa: F405
if insecure_cors_origins:
    raise ValueError("Production CORS_ALLOWED_ORIGINS must contain only HTTPS origins.")
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
