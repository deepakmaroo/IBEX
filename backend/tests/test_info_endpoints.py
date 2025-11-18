import pytest


def test_version():
    response = pytest.test_client.get("/info/version")
    assert response.status_code == 200
    assert "version" in response.json().keys()


def test_downsampling_methods():
    response = pytest.test_client.get("/info/downsampling_methods")
    assert response.status_code == 200
    assert "downsampling_methods" in response.json().keys()
    assert len(response.json()["downsampling_methods"]) >= 4  # at least 4 methods are provided by ts_downsample library
