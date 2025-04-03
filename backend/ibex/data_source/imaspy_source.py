from typing import Optional, Sequence, List

import imaspy  # type: ignore
import numpy as np  # type: ignore
import re  # type: ignore
from idstools.database import DBMaster  # type: ignore
from imaspy.ids_metadata import IDSMetadata  # type: ignore
from imaspy.ids_primitive import IDSNumericArray  # type: ignore
from imaspy.ids_primitive import IDSPrimitive  # type: ignore
from imaspy.ids_struct_array import IDSStructArray  # type: ignore
from imaspy.ids_structure import IDSStructure  # type: ignore
from imaspy.ids_data_type import IDSDataType  # type: ignore
from imaspy.ids_base import IDSBase  # type: ignore
from imaspy.ids_path import IDSPath  # type: ignore

from imas_core.exception import ImasCoreBackendException

from ibex.data_source.data_source_interface import DataSourceInterface
from ibex.data_source.exception import (
    NodeNotFoundException,
    IdsNotFoundException,
    NotALeafNodeException,
    NotAnArrayException,
)


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
        except ImasCoreBackendException:
            return False
        return True

    def list_idses(self, uri: str) -> dict:
        """
        Returns list of IDSes with occurrence numbers that are filled in given data entry uri
        :param uri: imas URI
        :return: dictionary: {'idses': [{'name':<name>, 'occurrences':[<0>,<1>,...]}, {'name': ...}]}
        """
        try:
            entry = imaspy.DBEntry(uri, mode="r")
        except ImasCoreBackendException as e:
            raise IdsNotFoundException(e) from None
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

    def _jsonify_metadata(self, metadata: IDSMetadata, recursive: bool = False, show_error_bars: bool = False) -> dict:
        """
        Converts imaspy.ids_metadata.IDSMetadata into dictionary
        :param metadata: imaspy.ids_metadata.IDSMetadata - metadata to be converted
        :param recursive: if it should append recursively metadata of children, children of children and so on...
        :param show_error_bars: whether error bar nodes should be returned, or not
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
                {"name": child.name, "type": child.data_type, "ndim": child.ndim}
                for child in metadata
                if show_error_bars or not any(x in child.name for x in ["_error_upper", "_error_lower", "_error_index"])
            ]

        return result

    def get_node_info(
        self,
        uri: str,
        ids: str,
        node_path: str,
        occurrence: int = 0,
        recursive: bool = False,
        show_error_bars: bool = False,
    ) -> dict:
        """
        Returns dictionary with basic info about IDS node pointed by `node_path` argument
        :param uri: pulsefile uri - used only to get proper DD version
        :param ids: name of ids e.g. core_profiles
        :param node_path: path to ids node e.g. ids_properties/version_put
        :param occurrence: ids occurrence number
        :param recursive: if True, creates node_info tree.
            if False, returns only pointed node and it's children node_info
        :param show_error_bars: whether error bar nodes should be returned, or not
        :return:
        """

        metadata, coordinates = self._get_metadata_and_coordinates(uri, ids, node_path, occurrence)
        metadata_dict = self._jsonify_metadata(metadata, recursive, show_error_bars)
        metadata_dict["coordinates"] = list(coordinates.values())

        # fill 'shape', but omit it if path points to more than one node
        if metadata_dict["ndim"] > 0 and ":" not in node_path:
            # _get_raw_data() returns list even if path points to one node, so we access [0] element
            target_node = self._get_raw_data(uri, ids, [node_path], occurrence)[0]
            if isinstance(target_node, IDSStructure):
                return metadata_dict

            if metadata_dict["type"] == IDSDataType.STRUCT_ARRAY or metadata_dict["type"] == IDSDataType.STR:
                metadata_dict["shape"] = [len(target_node)]
            else:  # Numeric array
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
        try:
            entry = imaspy.DBEntry(uri, mode="r")
        except ImasCoreBackendException as e:
            raise IdsNotFoundException(e) from None
        try:
            ids_obj = entry.get(ids, lazy=True, autoconvert=False, occurrence=occurrence)
        except imaspy.exception.IDSNameError as e:
            raise IdsNotFoundException(e) from None

        for node_path in node_paths:
            data_path = imaspy.ids_path.IDSPath(node_path)
            try:
                ids_data = data_path.goto(ids_obj, from_root=True)
            except AttributeError as e:
                raise NodeNotFoundException(e) from None
            result.append(ids_data)

        return result

    def _slice_to_string(self, slice_obj: slice | None | int):
        """
        Coverts slice object into it's string representation e.g. slice(1,2,3) -> [1:2:3]
        :param slice_obj: slice object
        :return: string representation of slice
        """
        if slice_obj is None:
            return ""
        if not isinstance(slice_obj, slice):
            # str, int, etc.
            return f"[{slice_obj}]"

        start = str(slice_obj.start) if slice_obj.start else ""
        stop = str(slice_obj.stop) if slice_obj.stop else ""
        step = str(slice_obj.step) if slice_obj.step else ""

        if not step:
            return f"[{start}:{stop}]"
        elif not start:
            return f"[:{stop}:{step}]"
        elif not stop:
            return f"[{start}::{step}]"
        else:
            return f"[{start}:{stop}:{step}]"

    def _get_path_and_path_ancestors(self, node_path: IDSPath):
        """
        Returns list of path and it's ancestors
        :param node_path: node_path
        :return: list of path and ancestors
        """

        # =========== Extract path ancestors ===========
        path_elements: List[str] = [f"{x[0]}{self._slice_to_string(x[1])}" for x in node_path.items()]

        # contains IDSPaths of all ancestors of path + path itself
        ancestors_and_path = []
        for i in range(1, len(path_elements) + 1):
            ancestors_and_path.append(IDSPath("/".join(path_elements[:i])))

        # sort list to contain leaf nodes coordinates at the beginning
        ancestors_and_path.sort(key=lambda x: len(str(x)), reverse=True)

        return ancestors_and_path

    def _get_metadata_and_coordinates(
        self, uri: str, ids: str, node_path: str, occurrence: int = 0
    ) -> (IDSMetadata, List[str]):
        """

        :param uri:
        :param ids:
        :param node_path:
        :param occurrence:
        :return:
        """

        try:
            entry = imaspy.DBEntry(uri, mode="r")
        except ImasCoreBackendException as e:
            raise IdsNotFoundException(e) from None

        try:
            ids_obj = entry.get(ids, lazy=True, autoconvert=False, occurrence=occurrence)
        except imaspy.exception.IDSNameError as e:
            raise IdsNotFoundException(e) from None

        is_time_homogeneous = ids_obj.ids_properties.homogeneous_time

        data_path = IDSPath(node_path)
        try:
            node_metadata = data_path.goto_metadata(ids_obj.metadata)
        except ValueError as e:
            raise NodeNotFoundException(e) from None
        ancestors_and_path = self._get_path_and_path_ancestors(data_path)

        # dict "node" : "coordinate"
        # e.g "profiles_1d[:]" : "time"
        coordinates = {}
        for element in ancestors_and_path:
            element_metadata = element.goto_metadata(ids_obj.metadata)

            for coord in element_metadata.coordinates:
                if is_time_homogeneous and coord.is_time_coordinate:
                    coordinates[element] = "time"
                else:
                    coordinates[element] = str(coord)

        return (node_metadata, coordinates)

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

    def _add_index_to_aos_in_path(self, ids_metadata: imaspy.ids_base.IDSBase, path_str: str):
        """
        Helper function to add `[:]` to AoSs in path:
        eg: source/profiles_1d/time -> source[:]/profiles_1d[:]/time (core_sources)
        :param ids_metadata: root of metadata path refers to
        :param path_str: path string
        :return: reworked string path
        """
        path_elements = path_str.split("/")
        result = ""

        for element in path_elements:
            ids_path = IDSPath(element)
            ids_metadata = ids_path.goto_metadata(ids_metadata)
            result += element
            if ids_metadata.data_type == IDSDataType.STRUCT_ARRAY:
                result += "[:]"
            result += "/"

        # return result without unnecessary "/" at the end
        return result[:-1]

    def find_paths(self, uri: str, searched_node: str, show_error_bars: bool = False) -> dict:
        """
        Finds paths containing phrase passed in searched_node argument
        :param uri: imas URI
        :param searched_node: searched text
        :param show_error_bars: whether error bar nodes should be returned, or not
        :return: dictionary {'paths': ['path/to/node1','path/to/node2', ...]}
        """
        try:
            entry = imaspy.DBEntry(uri, mode="r")
        except ImasCoreBackendException as e:
            raise IdsNotFoundException(e) from None

        found_paths = []
        ids_list = entry.factory.ids_names()

        for ids in ids_list:
            try:
                ids_obj = entry.get(ids, occurrence=0, autoconvert=False, lazy=True)
                paths = [node for node in imaspy.util.find_paths(ids_obj, searched_node)]
                for path in paths:
                    if not show_error_bars and any(
                        error_node in path for error_node in ["_error_upper", "_error_lower", "_error_index"]
                    ):
                        continue
                    found_paths.append(f"#{ids}/{self._add_index_to_aos_in_path(ids_obj.metadata, path)}")
            except imaspy.exception.DataEntryException:
                continue

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
        node_paths = self._expand_node_path(uri, ids, node_path, occurrence)
        ids_data = self._get_raw_data(uri, ids, node_paths, occurrence)

        # test if all values are the same type
        # if not all(type(x) == type(ids_data[0]) for x in ids_data):
        #    raise DifferentTypesException(f"Nodes pointed by path {node_path} have different types and cannot be summarized")

        if len(ids_data) > 1:
            raise NotImplementedError(
                "Multiple nodes summary is not supported yet. Make sure your IDS path points to only one node"
            )

        if isinstance(ids_data[0], IDSStructure) or isinstance(ids_data[0], IDSStructArray):
            raise NotALeafNodeException(f"Path {node_path} does not point to a leaf node")

        if not isinstance(ids_data[0], IDSNumericArray):
            raise NotAnArrayException("Cannot get array summary of non array node")

        result = {}

        result["shape"] = ids_data[0].shape
        result["min"] = np.min(ids_data[0])
        result["max"] = np.max(ids_data[0])
        result["mean"] = np.mean(ids_data[0])
        result["standard_deviation"] = np.std(ids_data[0])

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

        try:
            entry = imaspy.DBEntry(uri, mode="r")
        except ImasCoreBackendException as e:
            raise IdsNotFoundException(e) from None

        try:
            ids_root = entry.get(ids, lazy=True, autoconvert=False, occurrence=occurrence)
        except imaspy.exception.IDSNameError as e:
            raise IdsNotFoundException(e) from None

        for path_element in node_path.split("/"):
            parent_paths = self._expand_single_path_element(ids_root, path_element, parent_paths)
            if not parent_paths:
                raise NodeNotFoundException(
                    f"Cannot evaluate path. Path element: {path_element} from path: {node_path} returned empty list."
                )

        return parent_paths

    def _serialize_data(self, data: IDSBase):
        """
        Converts data IDS data into serializable values e.g. imaspy.int64 -> int
        :param data:
        :return: Serializable data value
        """
        if isinstance(data, IDSStructure):
            raise NotALeafNodeException("Cannot serialize non-leaf node")
        if isinstance(data, str):
            return data
        elif isinstance(data, list):
            return data
        elif isinstance(data, IDSNumericArray):
            return data.value.tolist()
        elif isinstance(data.value, np.ndarray):
            return data.tolist()
        else:
            return data.value

    def get_plot_data(self, uri: str, ids: str, node_path: str, occurrence: int = 0):
        """
        Returns all data used to plot selected quantity. Result contains data values, metadata and coordinates.
        :param uri: imas URI
        :param ids: name of ids e.g. core_profiles
        :param node_path: path to ids node e.g. ids_properties/version_put
        :param occurrence: ids occurrence number
        :return: Dictionary containing data values, metadata and coordinates.
        """

        node_paths = self._expand_node_path(uri, ids, node_path, occurrence)
        ids_data = self._get_raw_data(uri, ids, node_paths, occurrence)

        data_to_be_returned = [self._serialize_data(data) for data in ids_data]
        coordinates_to_be_returned = []

        # =================================

        metadata, coordinates_dict = self._get_metadata_and_coordinates(uri, ids, node_path, occurrence)

        # replace all dummy indexes by [:]. i.e. "itime", "i1", "i2", "i3"... -> [:]
        coordinates_dict = {key: re.sub(r"\[(.*?)\]", r"[:]", value) for key, value in coordinates_dict.items()}

        # =================================

        for target, coord in coordinates_dict.items():
            if coord == "1...N":
                # 1...N coords are targeting AoS
                # remove last [:] from path
                if str(target)[-3:] == "[:]":
                    target_str = str(target)[:-3]

                node_paths = self._expand_node_path(uri, ids, str(target_str), occurrence)
                coord_target_objects = self._get_raw_data(uri, ids, node_paths, occurrence)
                coord_values = [list(map(int, list(x.coordinates[0]))) for x in coord_target_objects]

                c = {
                    "name": coord,
                    "target": f"#{ids}/{target}",
                    "unit": "-",
                    "value": coord_values,
                    "shape": np.asarray(coord_values).shape,
                    "ndim": 2,
                    "path": "",
                    "description": "1...N",
                }
                coordinates_to_be_returned.append(c)

            else:
                coord_real_paths = self._expand_node_path(uri, ids, coord, occurrence)
                coord_data = self._get_raw_data(uri, ids, coord_real_paths, occurrence)
                serialized_data = [self._serialize_data(x) for x in coord_data]

                c = {
                    "name": coord.split("/")[-1],
                    "target": f"#{ids}/{target}",
                    "unit": coord_data[0].metadata.units,
                    "value": serialized_data,
                    "shape": np.asarray(serialized_data).shape,
                    "ndim": coord_data[0].metadata.ndim,
                    "path": f"#{ids}/{coord}",
                    "description": coord_data[0].metadata.documentation,
                }
                coordinates_to_be_returned.append(c)

        result = {
            "data": {
                "name": node_path.split("/")[-1],
                "unit": ids_data[0].metadata.units,
                "value": data_to_be_returned,
                "shape": np.asarray(data_to_be_returned).shape,
                "ndim": ids_data[0].metadata.ndim,
                "path": f"#{ids}/{node_path}",
                "description": ids_data[0].metadata.documentation,
                "coordinates": coordinates_to_be_returned,
            }
        }

        return result
