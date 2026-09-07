from .base import *  # noqa: F403

if not os.getenv("SECRET_KEY") or len(SECRET_KEY) < 50:  # noqa: F405
    raise ValueError("Production SECRET_KEY must be set and at least 50 characters.")
if not os.getenv("DATABASE_URL") or not os.getenv("ALLOWED_HOSTS"):  # noqa: F405
    raise ValueError("Production DATABASE_URL and ALLOWED_HOSTS are required.")
DEBUG = False
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
# Enable only behind a trusted proxy that overwrites this header.
if os.getenv("TRUST_PROXY", "false") == "true":  # noqa: F405
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
