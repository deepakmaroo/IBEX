import pytest


def test_field_value(entry_path):
    parameters = {
        "uri": f"imas:mdsplus?path={entry_path}#core_profiles/time",
    }
    response = pytest.test_client.get("/data/field_value", params=parameters)

    assert response.status_code == 200
    assert response.json()["value"] == [[1.0, 2.0, 3.0, 4.0, 5.0]]


def test_get_multiple_values(entry_path):
    parameters = {
        "uri": f"imas:mdsplus?path={entry_path}#core_profiles/profiles_1d[:]/time",
    }
    response = pytest.test_client.get("/data/field_value", params=parameters)

    assert response.status_code == 200
    assert response.json()["value"] == [1.0, 2.0, 3.0, 4.0, 5.0]


def test_get_non_existing_node(entry_path):
    parameters = {
        "uri": f"imas:mdsplus?path={entry_path}#non_existing_ids/non_existing_path",
    }
    response = pytest.test_client.get("/data/field_value", params=parameters)

    assert response.status_code == 404
