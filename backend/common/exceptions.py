from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from django.db import IntegrityError
from rest_framework.exceptions import (
    APIException, AuthenticationFailed, NotAuthenticated, NotFound,
    PermissionDenied, Throttled, ValidationError,
)
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from .security import security_event


class Conflict(APIException):
    status_code = 409
    default_code = "slot_unavailable"
    default_detail = "This appointment time is no longer available."


def exception_handler(exc, context):
    request = context.get("request")
    view_name = context.get("view").__class__.__name__ if context.get("view") else "unknown"
    if isinstance(exc, Throttled):
        security_event("rate_limited", request, status=429, outcome="blocked")
    elif isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        event = "token_refresh_failed" if view_name == "TokenRefreshView" else "authentication_failed"
        security_event(event, request, status=401, outcome="blocked")
    elif isinstance(exc, PermissionDenied):
        security_event("authorization_denied", request, status=403, outcome="blocked")
    elif isinstance(exc, (Http404, NotFound)) and getattr(getattr(request, "user", None), "is_authenticated", False):
        security_event("object_scope_denied", request, status=404, outcome="blocked")
    elif isinstance(exc, Conflict):
        security_event("booking_or_state_conflict", request, status=409, outcome="blocked")
    if isinstance(exc, DjangoValidationError):
        exc = ValidationError(getattr(exc, "message_dict", exc.messages))
    if isinstance(exc, IntegrityError):
        security_event("database_conflict", request, status=409, outcome="blocked")
        return Response({"success": False, "code": "conflict", "message": "This change conflicts with existing data.", "errors": {}}, status=409)
    response = drf_exception_handler(exc, context)
    if response is None:
        # Let Django report the error server-side; production's 500 handler is sanitized.
        return None
    codes = exc.get_codes() if isinstance(exc, APIException) else "error"
    code = codes if isinstance(codes, str) else "validation_error"
    detail = response.data
    message = str(detail.get("detail", "Please check the submitted information.")) if isinstance(detail, dict) else "Please check the submitted information."
    response.data = {"success": False, "code": code, "message": message, "errors": detail if code == "validation_error" else {}}
    return response
