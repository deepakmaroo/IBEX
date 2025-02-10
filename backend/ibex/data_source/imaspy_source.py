from typing import Optional, Sequence, List

import imaspy  # type: ignore
import numpy as np  # type: ignore
from idstools.database import DBMaster  # type: ignore
from imaspy.ids_metadata import IDSMetadata  # type: ignore
from imaspy.ids_primitive import IDSNumericArray  # type: ignore
from imaspy.ids_primitive import IDSPrimitive, IDSString1D  # type: ignore
from imaspy.ids_struct_array import IDSStructArray  # type: ignore
from imaspy.ids_structure import IDSStructure  # type: ignore
from imaspy.ids_base import IDSBase  # type: ignore

from ibex.data_source.data_source_interface import DataSourceInterface
from ibex.data_source.exception import NotALeafNodeException, NotAnArrayException


class IMASPySource(DataSourceInterface):
    def data_entry_exists(self, uri: str) -> bool:
        """
        Check if data entry can be opened
        :param uri: imas URI
        :return: True if entry can be opened, False otherwise
        """

        try:
            entry = imaspy.DBEntry(uri, mode="r")
            entry.close()
        except Exception:  # imas_core.exception.ImasCoreBackendException
            return False
        return True

    def list_idses(self, uri: str) -> dict:
        """
        Returns list of IDSes with occurrence numbers that are filled in given data entry uri
        :param uri: imas URI
        :return: dictionary: {'idses': [{'name':<name>, 'occurrences':[<0>,<1>,...]}, {'name': ...}]}
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
            if filled_occurrences:
                result["idses"].append({"name": ids_name, "occurrences": filled_occurrences})

        entry.close()
        return result

    def _jsonify_metadata(self, metadata: IDSMetadata, recursive: bool = False) -> dict:
        """
        Converts imaspy.ids_metadata.IDSMetadata into dictionary
        :param metadata: imaspy.ids_metadata.IDSMetadata - metadata to be converted
        :param recursive: if it should append recursively metadata of children, children of children and so on...
        :return: metadata turned into dictionary with keys: `name`:str, `type`:str, `ndim`:str, `shape`:str, `children`:list[dict]
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
        Returns dictionary with basic info about IDS node pointed by `node_path` argument
        :param uri: pulsefile uri - used only to get proper DD version
        :param ids: name of ids e.g. core_profiles
        :param node_path: path to ids node e.g. ids_properties/version_put
        :param occurrence: ids occurrence number
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

    def _get_raw_data(
        self, uri: str, ids: str, node_paths: List[str], occurrence: int = 0
    ) -> List[IDSStructure | IDSPrimitive]:
        """
        Internal function. Returns raw data extracted from IDS
        :param uri: imas URI
        :param ids: name of ids e.g. core_profiles
        :param node_path: list of paths to ids nodes e.g. ['ids_properties/version_put']
        :param occurrence: ids occurrence number
        :return: List[IDSStructure | IDSPrimitive], depending on node's content
        """

        result = []
        entry = imaspy.DBEntry(uri, mode="r")
        ids_obj = entry.get(ids, lazy=True, autoconvert=False, occurrence=occurrence)

        for node_path in node_paths:
            data_path = imaspy.ids_path.IDSPath(node_path)
            ids_data = data_path.goto(ids_obj, from_root=True)
            result.append(ids_data)
            print(f">>> {node_path}, {ids_data} --> {type(ids_data)}")

        return result

    def get_data(self, uri: str, ids: str, node_path: str, occurrence: int = 0, range: List[int] | None = None) -> dict:
        """
        Returns data extracted from IDS, converted into dictionary
        :param uri: imas URI
        :param ids: name of ids e.g. core_profiles
        :param node_path: path to ids node e.g. ids_properties/version_put
        :param occurrence: ids occurrence number
        :param range:
        :return: dictionary {'value':<node_value>}, where <node_value> represents data extracted from IDS node
        """

        result = []
        node_paths = self._expand_node_path(uri, ids, node_path, occurrence)
        ids_data = self._get_raw_data(uri, ids, node_paths, occurrence)

        for data in ids_data:
            if isinstance(data, IDSStructure):
                raise NotALeafNodeException(
                    f"Path {node_path} does not point to a leaf node. Cannot extract data from it."
                )

            if isinstance(data, str):
                result.append(data)

            elif isinstance(data.value, np.ndarray):
                result.append(data.tolist())
            else:
                result.append(data.value)

        return {"value": result}

    def find_paths(self, uri: str, ids: str, searched_node: str, occurrence: int = 0) -> dict:
        """
        Finds paths containing phrase passed in searched_node argument
        :param uri: imas URI
        :param ids: name of ids e.g. core_profiles
        :param searched_node: searched text
        :param occurrence: ids occurrence number
        :return: dictionary {'paths': ['path/to/node1','path/to/node2', ...]}
        """
        entry = imaspy.DBEntry(uri, mode="r")
        ids_obj = entry.get(ids, occurrence=occurrence, autoconvert=False)
        found_paths = imaspy.util.find_paths(ids_obj, searched_node)

        return {"paths": found_paths}

    def array_summary(self, uri: str, ids: str, node_path: str, occurrence: int = 0) -> dict:
        """
        Returns short summary of array node as a dictionary
        :param uri: imas URI
        :param ids: name of ids e.g. core_profiles
        :param node_path: path to ids node e.g. ids_properties/version_put
        :param occurrence: ids occurrence number
        :return: dictionary {'shape': [<dim1>,<dim2>, ...], 'min':<min_value>, 'max':<max_value>, 'mean':<mean>, 'standard_deviation':<s_d>}
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
        Returns list of available data entries
        :param user: owner of searched data entry
        :param backends: searched backends [<be1>, <be2>, ...]: default(None)
        :param database: searched database name: default(None)
        :param version: searched AL major version:
        :return: dictionary {'entries': [<uri1>, <uri2>, ...]}
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

    def _expand_single_path_element(self, ids_root: IDSBase, current_node_path, parent_paths=None):
        """
        Internal function. Expands single element of path
        :param ids_root: The root of the IDS data structure.
        :param current_node_path: The current path to start from.
        :param parent_paths: List of parent paths to consider. Defaults to [""].
        :return: list of str - A list of expanded paths.
        """
        ids_path = imaspy.ids_path.IDSPath(current_node_path)

        if parent_paths is None:
            parent_paths = [""]

        result = []

        for parent_path in parent_paths:
            element, element_index = next(ids_path.items())

            # Handle case where the index is a slice (e.g., element[start:stop:step])
            if isinstance(element_index, slice):
                # Evaluate start, stop and step parameters
                start = element_index.start if element_index.start else 0
                if element_index.stop:
                    stop = element_index.stop
                else:
                    full_current_path_without_index = imaspy.ids_path.IDSPath(
                        f"{parent_path}/{next(ids_path.items())[0]}"
                    )
                    ids_data = full_current_path_without_index.goto(ids_root, from_root=True)
                    stop = len(ids_data)
                step = element_index.step if element_index.step else 1

                # Append paths to result
                result += [f"{parent_path}/{element}[{x}]" for x in range(start, stop, step)]

            # Handle case where element_index is None (indicating no specific index)
            elif element_index is None:
                return [f"{x}/{element}" for x in parent_paths]

            # Handle case where element_index is a specific index (not a slice)
            else:
                return [f"{x}/{element}[{element_index}]" for x in parent_paths]

        return result

    def _expand_node_path(self, uri: str, ids: str, node_path: str, occurrence: int = 0):
        """

        :param ids:
        :param occurrence:
        :param node_path:
        :return:
        """
        parent_paths = [""]

        entry = imaspy.DBEntry(uri, mode="r")
        ids_root = entry.get(ids, occurrence=occurrence, lazy=True)

        for path_element in node_path.split("/"):
            parent_paths = self._expand_single_path_element(ids_root, path_element, parent_paths)
            if not parent_paths:
                raise Exception(
                    f"Cannot evaluate path. Path element: {path_element} from path: {node_path} returned empty list."
                )

        return parent_paths
