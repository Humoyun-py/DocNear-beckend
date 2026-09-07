import re
from datetime import time
from django.core.exceptions import ValidationError


def icon_name(value):
    if not re.fullmatch(r"[a-z][a-z0-9-]{0,49}", value):
        raise ValidationError("Use a vector icon name, such as heart-pulse.")


def working_hours(value):
    if not isinstance(value, dict):
        raise ValidationError("Use weekday keys 0–6 and arrays of [start, end] intervals.")
    try:
        for day, intervals in value.items():
            if day not in [str(i) for i in range(7)] or not isinstance(intervals, list):
                raise ValueError
            previous = None
            for start, end in sorted(intervals):
                s, e = time.fromisoformat(start), time.fromisoformat(end)
                if s >= e or (previous and s < previous) or s.tzinfo or e.tzinfo:
                    raise ValueError
                previous = e
    except (ValueError, TypeError):
        raise ValidationError("Working hours require ordered, non-overlapping same-day intervals (HH:MM).")
