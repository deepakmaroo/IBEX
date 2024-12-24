import pytest


def test_array_summary(entry_path):
    parameters = {
        "uri": f"imas:mdsplus?path={entry_path}",
        "ids": "core_profiles",
        "node_path": "time",
    }
    response = pytest.test_client.get("/data/field_value", params=parameters)

    assert response.status_code == 200
    assert response.json()["value"] == [1.0, 2.0, 3.0, 4.0, 5.0]
