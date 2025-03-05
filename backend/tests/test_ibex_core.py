from ibex.core.ibex_service import IMAS_URI


def test_core_uri_parser():
    uri_core = "imas:mdsplus?pulse=50101;run=1;user=palakb;database=tmp;version=3"
    uri_ids = ["core_profiles"]
    uri_occurrence = [":0", ":1", ""]
    uri_node_path = ["/path/to/node", "/ids_properties/version_put/access_layer", "/time_slice[:]/time", ""]

    for ids in uri_ids:
        for occurrence in uri_occurrence:
            for node_path in uri_node_path:
                uri_obj = IMAS_URI(f"{uri_core}#{ids}{occurrence}{node_path}")

                assert uri_obj.uri_entry_identifiers == uri_core
                assert uri_obj.ids_name == ids

                if occurrence:  # default occurrence is 0, so make sure we except 0 when not passing any occurrence
                    assert str(uri_obj.occurrence) == occurrence.replace(":", "")
                else:
                    assert str(uri_obj.occurrence) == "0"

                assert uri_obj.node_path == node_path.replace("/", "", 1)
