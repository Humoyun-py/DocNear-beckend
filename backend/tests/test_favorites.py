import pytest
from .helpers import data, error, authenticate

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("kind,attribute", [("doctors", "doctor"), ("clinics", "clinic")])
def test_favorite_lifecycle_isolation(client, world, kind, attribute):
    authenticate(client, world.patient)
    obj = getattr(world, attribute)
    prefix = f"/api/favorites/{kind}/"
    data(client.post(f"{prefix}{obj.pk}/"), 201)
    data(client.post(f"{prefix}{obj.pk}/"))
    assert data(client.get(prefix))["count"] == 1
    authenticate(client, world.other)
    assert data(client.get(prefix))["count"] == 0
    assert client.delete(f"{prefix}{obj.pk}/").status_code == 204
    authenticate(client, world.patient)
    assert data(client.get(prefix))["count"] == 1
    obj.is_active = False
    obj.save()
    assert data(client.get(prefix))["count"] == 0
    error(client.post(f"{prefix}{obj.pk}/"), 404)
    assert client.delete(f"{prefix}{obj.pk}/").status_code == 204


@pytest.mark.parametrize("kind", ["clinics", "doctors"])
@pytest.mark.parametrize("method", ["post", "delete"])
def test_collection_mutation_returns_405_not_500(client, world, kind, method):
    authenticate(client, world.patient)
    client.raise_request_exception = False
    error(getattr(client, method)(f"/api/favorites/{kind}/"), 405)
