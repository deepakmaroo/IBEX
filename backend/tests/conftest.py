import imaspy
import numpy as np
import pytest
from fastapi.testclient import TestClient

from ibex.main import app

pytest.test_client = TestClient(app)


@pytest.fixture(scope="session")
def entry_path(tmp_path_factory):
    tmp_path = tmp_path_factory.mktemp("testdb")

    entry = imaspy.DBEntry(f"imas:mdsplus?path={tmp_path}", mode="w")
    core_profiles = entry.factory.core_profiles()

    core_profiles.ids_properties.homogeneous_time = 1
    core_profiles.time = np.array([1.0, 2.0, 3.0, 4.0, 5.0])

    core_profiles.profiles_1d.resize(5)

    for aos_element, time_element in zip(core_profiles.profiles_1d, core_profiles.time):
        aos_element.time = time_element

    core_profiles.profiles_1d[0].ion.resize(1)

    # ===== for error bars test =====
    core_profiles.vacuum_toroidal_field.r0 = 1.0
    core_profiles.vacuum_toroidal_field.r0_error_upper = 2.0
    core_profiles.vacuum_toroidal_field.r0_error_lower = 0.1

    # ===== for plot data 1...N coord test =====
    for profiles_1d in core_profiles.profiles_1d:
        profiles_1d.ion.resize(3)

    entry.put(core_profiles)
    entry.close()

    return tmp_path
