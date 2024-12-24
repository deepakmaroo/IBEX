import pytest


def test_node_info_empty_path(entry_path):
    parameters = {
        "uri": f"imas:mdsplus?path={entry_path}",
        "ids": "core_profiles",
        "node_path": "",
    }
    response = pytest.test_client.get("/ids_info/node_info", params=parameters)

    # test some core_profiles nodes
    root_children = [
        "ids_properties",
        "profiles_1d",
        "profiles_2d",
        "global_quantities",
        "time",
    ]
    response_children = [x["name"] for x in response.json()["children"]]

    assert response.status_code == 200
    assert set(root_children).issubset(set(response_children))


def test_find_paths(entry_path):
    parameters = {
        "uri": f"imas:mdsplus?path={entry_path}",
        "ids": "core_profiles",
        "node_regex": "version_put",
    }
    response = pytest.test_client.get("/ids_info/find_paths", params=parameters)

    assert response.status_code == 200
    assert response.json()["paths"] == [
        "ids_properties/version_put",
        "ids_properties/version_put/data_dictionary",
        "ids_properties/version_put/access_layer",
        "ids_properties/version_put/access_layer_language",
    ]


def test_array_summary(entry_path):
    parameters = {
        "uri": f"imas:mdsplus?path={entry_path}",
        "ids": "core_profiles",
        "node_path": "time",
    }
    response = pytest.test_client.get("/ids_info/array_summary", params=parameters)

    assert response.status_code == 200
    assert response.json()["shape"] == [5]
    assert response.json()["min"] == 1.0
    assert response.json()["max"] == 5.0
    assert response.json()["mean"] == 3.0
