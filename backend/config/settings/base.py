import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = os.getenv("DOCNEAR_ENV_FILE")
if ENV_FILE:
    # An explicitly selected file is the source of truth for that process.
    load_dotenv(Path(ENV_FILE).expanduser(), override=True)
elif os.getenv("DJANGO_SETTINGS_MODULE", "").endswith(".development"):
    load_dotenv(BASE_DIR.parent / ".env")
SECRET_KEY = os.environ.get("SECRET_KEY", "development-only-change-this-before-deploying-docnear")
DEBUG = False
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",")
INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "django.contrib.postgres", "rest_framework", "rest_framework_simplejwt.token_blacklist",
    "django_filters", "corsheaders", "drf_spectacular",
] + [f"apps.{name}" for name in (
    "accounts", "clinics", "doctors", "specialties", "schedules", "appointments", "favorites",
    "reviews", "notifications", "analytics", "admin_panel", "doctor_panel", "clinic_owner_panel",
    "telegram_support",
)]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware", "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware", "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware", "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True,
              "OPTIONS": {"context_processors": ["django.template.context_processors.request",
                          "django.contrib.auth.context_processors.auth", "django.contrib.messages.context_processors.messages"]}}]
DATABASES = {"default": dj_database_url.parse(os.getenv("DATABASE_URL", "postgresql://docnear:docnear@localhost:5432/docnear"), conn_max_age=60)}
if DATABASES["default"]["ENGINE"] != "django.db.backends.postgresql":
    raise ValueError("DocNear requires PostgreSQL, including for tests.")
AUTH_USER_MODEL = "accounts.User"
AUTHENTICATION_BACKENDS = ["apps.accounts.backends.IdentifierBackend"]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
AUTH_LOGIN_MODE = os.getenv("AUTH_LOGIN_MODE", "both")
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
MEDIA_URL = os.getenv("MEDIA_URL", "/media/")
MEDIA_ROOT = BASE_DIR / "media"
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
CORS_ALLOWED_ORIGINS = [v.strip() for v in os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:3003,http://127.0.0.1:3003,http://localhost:3004,http://127.0.0.1:3004",
).split(",") if v.strip()]
CSRF_TRUSTED_ORIGINS = [v.strip() for v in os.getenv(
    "CSRF_TRUSTED_ORIGINS", ",".join(CORS_ALLOWED_ORIGINS)
).split(",") if v.strip()]
REST_FRAMEWORK = {
    # Forwarded headers are trusted only when an operator configures the exact
    # number of trusted proxies and prevents direct access to this service.
    "NUM_PROXIES": int(os.getenv("TRUSTED_PROXY_COUNT", "0")),
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["common.responses.EnvelopeRenderer"],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.Pagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend", "rest_framework.filters.SearchFilter", "rest_framework.filters.OrderingFilter"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "common.exceptions.exception_handler",
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.AnonRateThrottle", "rest_framework.throttling.UserRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/min", "user": "300/min", "auth": "10/min",
        "otp_request": os.getenv("OTP_REQUEST_RATE", "5/min"),
        "otp_verify": os.getenv("OTP_VERIFY_RATE", "10/min"),
    },
}
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "5"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": True, "BLACKLIST_AFTER_ROTATION": True, "CHECK_REVOKE_TOKEN": True,
}
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"security": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"}},
    "handlers": {"security_console": {"class": "logging.StreamHandler", "formatter": "security"}},
    "loggers": {"docnear.security": {"handlers": ["security_console"], "level": "WARNING", "propagate": False}},
}
SPECTACULAR_SETTINGS = {
    "TITLE": "DocNear API",
    "DESCRIPTION": "Shared patient, doctor, owner, admin and Telegram API. JSON responses wrap payloads in success/data; see docs/api-contract.md.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "ENUM_NAME_OVERRIDES": {
        "AccountRoleEnum": [("patient", "Patient"), ("doctor", "Doctor"), ("clinic_owner", "Clinic Owner"), ("admin", "Admin"), ("super_admin", "Super Admin")],
        "BroadcastRoleEnum": [("patient", "patient"), ("doctor", "doctor"), ("clinic_owner", "clinic_owner")],
        "AppointmentStatusEnum": [
            ("pending", "Pending"), ("confirmed", "Confirmed"), ("waiting", "Waiting"),
            ("in_progress", "In progress"), ("completed", "Completed"),
            ("cancelled", "Cancelled"), ("rejected", "Rejected"), ("no_show", "No show"),
        ],
        "WaitlistStatusEnum": [("waiting", "waiting"), ("cancelled", "cancelled"), ("booked", "booked")],
    },
}
REDIS_URL = os.getenv("REDIS_URL", "")
CACHES = {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": REDIS_URL}} if REDIS_URL else {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL or "redis://localhost:6379/1")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL or "redis://localhost:6379/2")
CELERY_TASK_IGNORE_RESULT = True
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true") == "true"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "DocNear <noreply@docnear.uz>")
PASSWORD_RESET_URL = os.getenv("PASSWORD_RESET_URL", "http://localhost:5173/reset-password")
TELEGRAM_BOT_WEBHOOK_SECRET = os.getenv("TELEGRAM_BOT_WEBHOOK_SECRET", "")
TELEGRAM_BOT_SECRET = os.getenv("TELEGRAM_BOT_SECRET", "") or TELEGRAM_BOT_WEBHOOK_SECRET
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "").strip().strip("\"'").lstrip("@")
TELEGRAM_OTP_ENABLED = os.getenv("TELEGRAM_OTP_ENABLED", "false").lower() == "true"
TELEGRAM_DELETE_WEBHOOK_ON_START = os.getenv("TELEGRAM_DELETE_WEBHOOK_ON_START", "false").lower() == "true"
DOCNEAR_API_BASE_URL = os.getenv("DOCNEAR_API_BASE_URL", "http://127.0.0.1:8001/api/v1").rstrip("/")
OTP_EXPIRE_MINUTES = int(os.getenv("OTP_EXPIRE_MINUTES", "5"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
OTP_PHONE_REQUEST_LIMIT = int(os.getenv("OTP_PHONE_REQUEST_LIMIT", "3"))
OTP_IP_REQUEST_LIMIT = int(os.getenv("OTP_IP_REQUEST_LIMIT", "20"))
SMS_OTP_ENABLED = os.getenv("SMS_OTP_ENABLED", "false").lower() == "true"
OTP_SMS_PROVIDER = os.getenv("OTP_SMS_PROVIDER", "console")
OTP_TEST_MODE = False
SMS_API_URL = os.getenv("SMS_API_URL", "")
SMS_API_KEY = os.getenv("SMS_API_KEY", "")
SMS_SENDER_NAME = os.getenv("SMS_SENDER_NAME", "DocNear")
LEGACY_PASSWORD_AUTH_ENABLED = os.getenv("LEGACY_PASSWORD_AUTH_ENABLED", "false").lower() == "true"
if os.getenv("AWS_STORAGE_BUCKET_NAME"):
    STORAGES = {"default": {"BACKEND": "storages.backends.s3.S3Storage", "OPTIONS": {
        "bucket_name": os.environ["AWS_STORAGE_BUCKET_NAME"], "default_acl": None,
        "querystring_auth": True, "file_overwrite": False,
        "endpoint_url": os.getenv("AWS_S3_ENDPOINT_URL") or None,
    }}, "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"}}
