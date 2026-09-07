from unittest.mock import patch
import pytest
from django.urls import path
from django.test import override_settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from config.urls import server_error, not_found
from .helpers import data, error, authenticate

pytestmark = pytest.mark.django_db


class DeliberateFailure(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        raise RuntimeError("QA private exception marker")


urlpatterns = [path("api/qa-failure/", DeliberateFailure.as_view())]
handler500 = server_error
handler404 = not_found


def test_production_500_and_404_are_sanitized_json(client):
    client.raise_request_exception = False
    with override_settings(ROOT_URLCONF=__name__, DEBUG=False):
        response = client.get("/api/qa-failure/")
        error(response, 500)
        assert "QA private exception marker" not in response.content.decode()
        error(client.get("/api/qa-missing/"), 404)


def test_paginated_envelopes(client, world):
    for prefix, account in [("/api/clinics/", None), ("/api/doctors/", None), ("/api/appointments/", world.patient),
                            ("/api/notifications/", world.patient), ("/api/admin-panel/patients/", world.admin)]:
        if account:
            authenticate(client, account)
        page = data(client.get(prefix, {"page_size": 1}))
        assert {"count", "next", "previous", "results"} <= page.keys()
        assert len(page["results"]) <= 1


def test_malformed_json_and_unsupported_methods(client, world):
    authenticate(client, world.patient)
    error(client.post("/api/appointments/", data="{bad", content_type="application/json"), 400)
    error(client.put("/api/appointments/", {}, format="json"), 405)


def test_health_database_failure_is_sanitized(client):
    with patch("config.urls.connection.cursor", side_effect=RuntimeError("private")):
        response = client.get("/health/")
    assert response.status_code == 503
    assert response.json()["success"] is False
    assert "private" not in response.content.decode()


def test_documentation_is_accessible_and_bot_security_is_declared(client):
    response = client.get('/api/schema/', HTTP_ACCEPT='application/vnd.oai.openapi+json')
    assert response.status_code == 200
    import json
    schema = json.loads(response.content)
    security = schema['paths']['/api/telegram/appointments/']['get']['security']
    assert {'TelegramBotSecret': [], 'TelegramLinkedUser': []} in security
    assert schema['paths']['/api/telegram/link/']['post']['security'] == [{'TelegramBotSecret': []}]
    response = client.get('/api/docs/')
    assert response.status_code == 200


def test_inventory_matches_export_and_postman_contains_every_operation():
    import json
    from pathlib import Path
    from qa.endpoints import endpoints
    root = Path(__file__).resolve().parents[2]
    inventory = json.loads((root/'docs/qa/endpoints.json').read_text())
    assert {(e['path'],e['method']) for e in inventory} == set(endpoints())
    collection = json.loads((root/'postman/DocNear.postman_collection.json').read_text())
    items = [item for folder in collection['item'][1:] for item in folder['item']]
    assert len(items) == len(endpoints())
    assert len({item['name'] for item in items}) == len(endpoints())
    assert all(variable['value'] == '' for variable in collection['variable'] if any(key in variable['key'] for key in ['password','token','secret']))
