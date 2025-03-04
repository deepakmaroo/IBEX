import pytest


def test_field_value(entry_path):
    parameters = {
        "uri": f"imas:mdsplus?path={entry_path}#core_profiles/time",
    }
    response = pytest.test_client.get("/data/field_value", params=parameters)

    assert response.status_code == 200
    assert response.json()["value"] == [1.0, 2.0, 3.0, 4.0, 5.0]
