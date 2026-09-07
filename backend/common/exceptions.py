from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response


class Conflict(APIException):
    status_code = 409
    default_code = "slot_unavailable"
    default_detail = "This appointment time is no longer available."


def exception_handler(exc, context):
    if isinstance(exc, DjangoValidationError):
        exc = ValidationError(getattr(exc, "message_dict", exc.messages))
    if isinstance(exc, IntegrityError):
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
