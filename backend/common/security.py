import hashlib
import logging

from rest_framework.throttling import BaseThrottle


logger = logging.getLogger("docnear.security")


def security_event(event: str, request=None, **fields) -> None:
    """Write a structured, low-cardinality event without request payloads or credentials."""
    values = {"event": event}
    if request is not None:
        user = getattr(request, "user", None)
        peer = BaseThrottle().get_ident(request) or "unknown"
        match = getattr(request, "resolver_match", None)
        values.update(
            method=getattr(request, "method", "unknown"),
            route=getattr(match, "route", None) or "unresolved",
            actor_id=getattr(user, "pk", None) or "anonymous",
            role=getattr(user, "role", None) or "anonymous",
            peer=hashlib.sha256(peer.encode()).hexdigest()[:12],
        )
    values.update({key: value for key, value in fields.items() if value is not None})
    logger.warning("security_event %s", " ".join(f"{key}={value}" for key, value in values.items()))
