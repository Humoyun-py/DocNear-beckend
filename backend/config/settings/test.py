from .base import *  # noqa: F403

DEBUG = True
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
REST_FRAMEWORK = {**REST_FRAMEWORK, "DEFAULT_THROTTLE_CLASSES": []}  # noqa: F405
DATABASES["default"]["CONN_MAX_AGE"] = 0  # noqa: F405

# Test cleanup must never flush a configured development/production Redis cache.
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "docnear-tests"}}
OTP_TEST_CODE = "111111"
OTP_TEST_MODE = True
OTP_SMS_PROVIDER = "console"
LEGACY_PASSWORD_AUTH_ENABLED = True
