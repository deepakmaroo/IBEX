from typing import Optional, Sequence, List

import imaspy  # type: ignore
import numpy as np  # type: ignore
from idstools.database import DBMaster  # type: ignore
from imaspy.ids_metadata import IDSMetadata  # type: ignore
from imaspy.ids_primitive import IDSNumericArray  # type: ignore
from imaspy.ids_primitive import IDSPrimitive, IDSString1D  # type: ignore
from imaspy.ids_struct_array import IDSStructArray  # type: ignore
from imaspy.ids_structure import IDSStructure  # type: ignore

from ibex.data_source.data_source_interface import DataSourceInterface
from ibex.data_source.exception import NotALeafNodeException, NotAnArrayException


class IMASPySource(DataSourceInterface):
    def data_entry_exists(self, uri: str) -> bool:
        """

        :param uri:
        :return:
        """

        try:
            entry = imaspy.DBEntry(uri, mode="r")
            entry.close()
        except Exception:  # imas_core.exception.ImasCoreBackendException
            return False
        return True

    def list_idses(self, uri: str) -> dict:
        """

        :param uri:
        :return:
        """
        entry = imaspy.DBEntry(uri, mode="r")
        ids_list = entry.factory.ids_names()
        result: dict = {"idses": []}

        # if "/uda?" in uri:
        #    return result

        for ids_name in ids_list:
            filled_occurrences = entry.list_all_occurrences(ids_name=ids_name)
            # filled_occurrences contains numpy.int32 types that have to be converted into int
            filled_occurrences = list(map(int, filled_occurrences))
            result["idses"].append({"name": ids_name, "occurrences": filled_occurrences})

        entry.close()
        return result

    def _jsonify_metadata(self, metadata: IDSMetadata, recursive: bool = False) -> dict:
        """

        :param metadata:
        :param recursive:
        :return:
        """

        result = {}
        result["name"] = metadata.name
        result["type"] = metadata.data_type or "structure"
        result["ndim"] = metadata.ndim
        result["shape"] = []  # empty for 0D data

        if recursive:
            result["children"] = [self._jsonify_metadata(child, recursive) for child in metadata]
        else:
            result["children"] = [
                {"name": child.name, "type": child.data_type, "ndim": child.ndim} for child in metadata
            ]
        return result

    def get_node_info(self, uri: str, ids: str, node_path: str, occurrence: int = 0, recursive: bool = False) -> dict:
        """

        :param uri: pulsefile uri - used only to get proper DD version
        :param ids: name of ids e.g. core_profiles
        :param node_path: path to ids node e.g. ids_properties/version_put
        :param recursive: if True, creates node_info tree.
            if False, returns only pointed node and it's children node_info
        :return:
        """

        target_node = self._get_raw_data(uri, ids, node_path, occurrence)
        metadata = target_node.metadata
        metadata_dict = self._jsonify_metadata(metadata, recursive)

        if isinstance(target_node, IDSStructArray) or isinstance(target_node, IDSString1D):
            metadata_dict["shape"] = [len(target_node)]

        elif isinstance(target_node, IDSNumericArray):
            metadata_dict["shape"] = target_node.shape

        return metadata_dict

    def _get_raw_data(self, uri: str, ids: str, node_path: str, occurrence: int = 0) -> IDSStructure | IDSPrimitive:
        """

        :param uri:
        :param ids:
        :param node_path:
        :return:
        """

        entry = imaspy.DBEntry(uri, mode="r")
        ids_data = entry.get(ids, lazy=True, autoconvert=False, occurrence=occurrence)

        data_path = imaspy.ids_path.IDSPath(node_path)
        ids_data = data_path.goto(ids_data, from_root=True)

        return ids_data

    def get_data(self, uri: str, ids: str, node_path: str, occurrence: int = 0, range: List[int] | None = None) -> dict:
        """

        :param uri:
        :param ids:
        :param node_path:
        :return:
        """

        ids_data = self._get_raw_data(uri, ids, node_path, occurrence)

        if isinstance(ids_data, IDSStructure):
            raise NotALeafNodeException(f"Path {node_path} does not point to a leaf node")

        if isinstance(ids_data, str):
            return {"value": ids_data}

        if isinstance(ids_data.value, np.ndarray):
            return {"value": ids_data.value.tolist()}

        return {"value": ids_data.value}

    def find_paths(self, uri: str, ids: str, node_path: str) -> dict:
        """

        :param uri:
        :param ids:
        :param node_path:
        :return:
        """
        entry = imaspy.DBEntry(uri, mode="r")
        ids_obj = entry.get(ids, autoconvert=False)
        found_paths = imaspy.util.find_paths(ids_obj, node_path)

        return {"paths": found_paths}

    def array_summary(self, uri: str, ids: str, node_path: str, occurrence: int = 0) -> dict:
        """

        :param uri:
        :param ids:
        :param node_path:
        :return:
        """
        ids_data = self._get_raw_data(uri, ids, node_path, occurrence)

        if isinstance(ids_data, IDSStructure) or isinstance(ids_data, IDSStructArray):
            raise NotALeafNodeException(f"Path {node_path} does not point to a leaf node")

        if not isinstance(ids_data, IDSNumericArray):
            raise NotAnArrayException("Cannot get array summary of non array node")

        result = {}

        result["shape"] = ids_data.shape
        result["min"] = np.min(ids_data)
        result["max"] = np.max(ids_data)
        result["mean"] = np.mean(ids_data)
        result["standard_deviation"] = np.std(ids_data)

        return result

    def list_db_entries(
        self,
        user: str,
        backends: Optional[Sequence[str]] = None,
        database: Optional[str] = None,
        version: Optional[int] = None,
    ) -> dict:
        """

        :param user:
        :param backends:
        :param database:
        :param version:
        :return:
        """

        result: dict[str, list[str]] = {}
        result["entries"] = []

        try:
            dbs = DBMaster.get_database_files(user, database, version, backends)
        except FileNotFoundError as e:
            raise e  # TODO: return HTTP error to client

        for dbname, dvs in dbs:
            if database and database not in dbname:
                continue
            for dv, dbbackends in dvs:
                if version and dv != version:
                    continue
                for backend, dbs in dbbackends:
                    if backends and backend not in backends:
                        continue
                    for pulse, runs in sorted(dbs.items()):
                        for r in sorted(runs, key=lambda x: x[1]):
                            result["entries"].append(
                                f"imas:{backend.lower()}?user={user};pulse={pulse};"
                                f"run={r[1]};database={dbname};version={dv}"
                            )
        return result
