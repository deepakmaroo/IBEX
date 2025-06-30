import pytest


def test_version():
    response = pytest.test_client.get("/info/version")
    assert response.status_code == 200
    assert "version" in response.json().keys()
