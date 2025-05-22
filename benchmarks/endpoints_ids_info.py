from fastapi.testclient import TestClient
from ibex.main import app
from . import uris, uris_label


class TimeIdsInfoEndpointsSuite:
    param_names = uris_label
    params = uris

    def setup(self, *args):
        self.test_client = TestClient(app)

    def time_node_info(self, uri, node_path):
        parameters = {"uri": f"{uri}/{node_path}"}
        self.test_client.get("/data_entry/node_info", params=parameters)

    time_node_info.param_names = param_names + ["node path"]
    time_node_info.params = (
        uris,
        [
            "#core_profiles:0/",  # IDS_BASE
            "#core_profiles:0/ids_properties",  # STRUCTURE
            "#core_profiles:0/ids_properties/version_put/access_layer",  # STR
            "#core_profiles:0/profiles_1d",  # AoS
            "#core_profiles:0/profiles_1d[0]",  # AoS element
            "#core_profiles:0/profiles_1d[0]/t_i_average",
        ],
    )

    # def time_find_field(self, searched_node):
    #    parameters = {"uri": uri}
    #    self.test_client.get("/data_entry/find_paths", params=parameters)

    # def time_array_summary(self, backend, database, user, version):
    #    parameters = {
    #        "backend" : backend,
    #        "database" : database,
    #        "user": user,
    #        "version" : version,
    #      }
    #    self.test_client.get("/data_entry/array_summary", params=parameters)
