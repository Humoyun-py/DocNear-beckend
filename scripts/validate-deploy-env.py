#!/usr/bin/env python3
"""Validate a DocNear deployment environment without revealing its values."""

from __future__ import annotations

import argparse
import re
import stat
import sys
from pathlib import Path
from urllib.parse import urlsplit

PLACEHOLDER_MARKERS = (
    "replace_me",
    "replace_with",
    "change_me",
    "changeme",
    "example.com",
    ".example",
    ".example.test",
    "your_",
    "<",
    ">",
)
REQUIRED = (
    "DJANGO_SETTINGS_MODULE",
    "DEBUG",
    "SECRET_KEY",
    "DATABASE_URL",
    "ALLOWED_HOSTS",
    "CORS_ALLOWED_ORIGINS",
    "CSRF_TRUSTED_ORIGINS",
    "REDIS_URL",
    "SMS_OTP_ENABLED",
    "OTP_SMS_PROVIDER",
    "POSTGRES_PASSWORD",
)
def parse_env(path: Path) -> tuple[dict[str, str], list[str]]:
    values: dict[str, str] = {}
    errors: list[str] = []
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        if "=" not in line:
            errors.append(f"line {number}: expected NAME=value")
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name):
            errors.append(f"line {number}: invalid variable name")
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[name] = value
    return values, errors


def is_placeholder(value: str) -> bool:
    lowered = value.lower()
    return any(marker in lowered for marker in PLACEHOLDER_MARKERS)


def split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def valid_https_origin(origin: str) -> bool:
    parsed = urlsplit(origin)
    return bool(
        parsed.scheme == "https"
        and parsed.hostname
        and not parsed.username
        and not parsed.password
        and not parsed.path.rstrip("/")
        and not parsed.query
        and not parsed.fragment
        and "*" not in origin
    )


def contains_localhost(value: str) -> bool:
    lowered = value.lower()
    return "localhost" in lowered or "127.0.0.1" in lowered or "0.0.0.0" in lowered


def validate(path: Path) -> list[str]:
    values, errors = parse_env(path)
    for name in REQUIRED:
        if not values.get(name, "").strip():
            errors.append(f"{name}: required")

    for name, value in values.items():
        if value and is_placeholder(value):
            errors.append(f"{name}: placeholder/example value is not allowed")

    secret = values.get("SECRET_KEY", "")
    if secret and (len(secret) < 50 or len(set(secret)) < 10):
        errors.append("SECRET_KEY: must be at least 50 characters with adequate variety")

    if values.get("DEBUG", "").strip().lower() not in {"false", "0"}:
        errors.append("DEBUG: must be false")
    if values.get("DJANGO_SETTINGS_MODULE") != "config.settings.production":
        errors.append("DJANGO_SETTINGS_MODULE: must select config.settings.production")

    database_url = values.get("DATABASE_URL", "")
    if database_url and urlsplit(database_url).scheme not in {"postgres", "postgresql"}:
        errors.append("DATABASE_URL: must be a PostgreSQL URL")
    redis_url = values.get("REDIS_URL", "")
    if redis_url and urlsplit(redis_url).scheme not in {"redis", "rediss"}:
        errors.append("REDIS_URL: must be a Redis URL")

    hosts = split_csv(values.get("ALLOWED_HOSTS", ""))
    if not hosts:
        errors.append("ALLOWED_HOSTS: at least one explicit hostname is required")
    elif any("*" in host or "://" in host or "/" in host for host in hosts):
        errors.append("ALLOWED_HOSTS: wildcards, schemes and paths are not allowed")

    for name in ("CORS_ALLOWED_ORIGINS", "CSRF_TRUSTED_ORIGINS"):
        origins = split_csv(values.get(name, ""))
        if not origins:
            errors.append(f"{name}: at least one HTTPS origin is required")
        elif any(not valid_https_origin(origin) for origin in origins):
            errors.append(f"{name}: every entry must be an explicit HTTPS origin")

    sms_enabled_value = values.get("SMS_OTP_ENABLED", "").lower()
    if sms_enabled_value not in {"false", "0", "true", "1"}:
        errors.append("SMS_OTP_ENABLED: must be true or false")
    sms_enabled = sms_enabled_value in {"true", "1"}
    if sms_enabled:
        if values.get("OTP_SMS_PROVIDER", "").lower() != "http":
            errors.append("OTP_SMS_PROVIDER: enabled SMS OTP requires the http provider")
        for name in ("SMS_API_URL", "SMS_API_KEY"):
            if not values.get(name, "").strip():
                errors.append(f"{name}: required when SMS OTP is enabled")
        sms_url = urlsplit(values.get("SMS_API_URL", ""))
        if values.get("SMS_API_URL") and (
            sms_url.scheme != "https" or not sms_url.hostname or sms_url.username or sms_url.password
        ):
            errors.append("SMS_API_URL: must be HTTPS with no embedded credentials")

    telegram_enabled = values.get("TELEGRAM_OTP_ENABLED", "false").lower() in {"1", "true", "yes", "on"}
    if telegram_enabled:
        for name in ("TELEGRAM_BOT_TOKEN", "TELEGRAM_BOT_USERNAME", "TELEGRAM_BOT_WEBHOOK_SECRET"):
            if not values.get(name, "").strip():
                errors.append(f"{name}: required when Telegram OTP is enabled")

    production_like = path.name in {".env.production", ".env.staging"} or values.get(
        "DJANGO_SETTINGS_MODULE"
    ) == "config.settings.production"
    if production_like:
        for name, value in values.items():
            if value and contains_localhost(value):
                errors.append(f"{name}: localhost/loopback is not allowed in deployment configuration")

    if values.get("LEGACY_PASSWORD_AUTH_ENABLED", "false").lower() not in {"false", "0"}:
        errors.append("LEGACY_PASSWORD_AUTH_ENABLED: must be false")

    mode = stat.S_IMODE(path.stat().st_mode)
    if mode & 0o077:
        errors.append("environment file permissions must be 0600 or stricter")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("env_file", type=Path)
    args = parser.parse_args()
    path = args.env_file.expanduser()
    if not path.is_file():
        print(f"ERROR: environment file not found: {path}", file=sys.stderr)
        return 2
    try:
        errors = validate(path)
    except (OSError, UnicodeError) as exc:
        print(f"ERROR: unable to read environment file: {exc.__class__.__name__}", file=sys.stderr)
        return 2
    if errors:
        print(f"Environment validation failed for {path}:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        print("No secret values were displayed.", file=sys.stderr)
        return 1
    print(f"Environment validation passed for {path}. No secret values were displayed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
