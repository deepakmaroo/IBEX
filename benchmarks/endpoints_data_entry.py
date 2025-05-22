from fastapi.testclient import TestClient
from ibex.main import app
from . import uris, uris_label


class TimeDataEntryEndpointsSuite:
    param_names = uris_label
    params = uris

    def setup(self, *args):
        self.test_client = TestClient(app)

    def time_exists(self, uri):
        parameters = {"uri": uri}
        self.test_client.get("/data_entry/exists", params=parameters)

    def time_list_idses(self, uri):
        parameters = {"uri": uri}
        self.test_client.get("/data_entry/list_idses", params=parameters)

    def time_available_entries(self, backend, database, user, version):
        parameters = {
            "backend": backend,
            "database": database,
            "user": user,
            "version": version,
        }
        self.test_client.get("/data_entry/available_entries", params=parameters)

    time_available_entries.params = (
        ["mdsplus", "hdf5"],
        ["iter", "ITER"],
        ["public"],
        ["3"],
    )
    time_available_entries.param_names = ["backend", "database", "user", "version"]
