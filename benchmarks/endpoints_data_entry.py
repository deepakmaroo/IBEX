from fastapi.testclient import TestClient
from ibex.main import app
import sys


class TimeDataEntryEndpoints:
    class TimeSuite:
        param_names = ["pulsefile uri"]
        params = [
            "imas:mdsplus?pulse=135012;run=1;user=public;database=iter;version=3",  # 245 slices
            "imas:mdsplus?pulse=135014;run=1;user=public;database=iter;version=3",  # 984 slices
            "imas:mdsplus?user=public;database=ITER;pulse=135009;run=5;version=3",  # 11808 slices
            "imas:mdsplus?user=public;database=ITER;pulse=135010;run=5;version=3",  # 70340 slices
            "imas:mdsplus?user=public;database=ITER;pulse=135002;run=5;version=3",  # 127340 slices
        ]

        def setup(self):
            self.test_client = TestClient(app)

        def time_exists(self, uri):
            print(f"RUNNING BENCHMARK FOR URI: {uri}", file=sys.stderr)
            parameters = {"uri": uri}

            self.test_client.get("/data_entry/exists", params=parameters)
            # ibex.endpoints.data_entry.exists(uri)
