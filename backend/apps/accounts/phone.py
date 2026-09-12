"""Shared phone-number normalization for every DocNear API entry point."""

import re


PHONE_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")
PHONE_MESSAGE = "Telefon raqamini to‘g‘ri kiriting. Masalan: +998901234567"


def normalize_phone_number(value: str) -> str:
    """Normalize international and local Uzbek phone input to E.164."""
    raw = str(value or "").strip()
    if re.search(r"[^\d+\s().-]", raw):
        raise ValueError(PHONE_MESSAGE)
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("00"):
        digits = digits[2:]
    if len(digits) == 10 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) == 9:
        digits = "998" + digits
    normalized = "+" + digits
    if not PHONE_PATTERN.fullmatch(normalized):
        raise ValueError(PHONE_MESSAGE)
    return normalized


def mask_phone_number(value: str) -> str:
    """Return a diagnostic-safe phone representation."""
    try:
        normalized = normalize_phone_number(value)
    except ValueError:
        return "invalid"
    if len(normalized) < 10:
        return "***"
    return f"{normalized[:6]}****{normalized[-3:]}"
