import pytest
from qa.endpoints import endpoints, allowed_roles, ROLES
from .helpers import authenticate, error

OPERATIONS = [(path, method) for path, method in endpoints() if path not in {"/api/docs/", "/api/schema/"}]


@pytest.mark.django_db
@pytest.mark.parametrize("role", ROLES)
@pytest.mark.parametrize("path,method", OPERATIONS, ids=[f"{method} {path}" for path, method in OPERATIONS])
def test_every_operation_role_boundary(client, world, role, path, method, record_property):
    account = {"patient": world.patient, "doctor": world.doctor_user, "clinic_owner": world.owner,
               "admin": world.admin, "super_admin": world.superadmin}.get(role)
    if account:
        authenticate(client, account)
    # Missing records keep this access-control probe separate from business mutations.
    url = path.replace("{pk}", "999999999").replace("{booking_id}", "DN-QA-NOT-FOUND")
    response = getattr(client, method.lower())(url, {}, format="json")
    allowed = allowed_roles(path, method)
    expected = "bot credentials" if allowed is None else "allowed" if role in allowed else "denied"
    for key, value in [("endpoint", path), ("method", method), ("role", role), ("expected", expected), ("status", response.status_code)]:
        record_property(key, value)
    if allowed is None:
        canonical = path.replace("/api/v1/", "/api/", 1)
        manual_bot_views = {
            "/api/telegram/link/",
            "/api/telegram/phone-link/",
            "/api/telegram/request-otp/",
        }
        error(response, 403 if canonical in manual_bot_views else 401)
    elif role not in allowed:
        error(response, 401 if role == "anonymous" else 403)
    else:
        assert response.status_code in {200, 201, 204, 400, 404, 409}, (method, path, role, response.status_code)
        if response.status_code >= 400:
            error(response, response.status_code)
        elif response.status_code != 204:
            assert response.json()["success"] is True
