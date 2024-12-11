from ibex.data_source.data_source_interface import DataSourceInterface
from ibex.data_source.exception import *

import re  # type: ignore
import numpy as np  # type: ignore

import imaspy  # type: ignore
from imaspy.ids_struct_array import IDSStructArray  # type: ignore
from imaspy.ids_primitive import IDSNumericArray, IDSString1D  # type: ignore


class IMASPySource(DataSourceInterface):

    def data_entry_exists(self, uri: str):
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

    def list_idses(self, uri: str):
        """

        :param uri:
        :return:
        """
        entry = imaspy.DBEntry(uri, mode="r")
        ids_list = entry.factory.ids_names()
        result = {"idses": []}

        # if "/uda?" in uri:
        #    return result

        for ids_name in ids_list:
            filled_occurrences = entry.list_all_occurrences(ids_name=ids_name)
            # filled_occurrences contains numpy.int32 types that have to be converted into int
            filled_occurrences = list(map(int, filled_occurrences))
            result["idses"].append(
                {"name": ids_name, "occurrences": filled_occurrences}
            )

        entry.close()
        return result

    def _get_node_metadata(
        self, uri: str, ids: str, node_path: str
    ) -> imaspy.ids_metadata.IDSMetadata:
        """
        Returns metadata attribute of ids node
        :param uri: pulsefile uri - used only to get proper DD version
        :param ids: name of ids e.g. core_profiles
        :param node_path: path to ids node e.g. ids_properties/version_put
        :return: node metadata attribute
        """

        entry = imaspy.DBEntry(uri, mode="r")
        ids_factory = (
            entry.factory
        )  # get factory from entry to make sure we use proper dd version
        entry.close()
        ids = ids_factory.new(ids)
        metadata = ids.metadata

        # if node_path is empty, return metadata of root
        if not node_path:
            return metadata

        # traverse through metadata to find node pointed by node_path
        for node in node_path.split("/"):
            for child_node in metadata:
                if child_node.name == node:
                    metadata = child_node
                    break
            else:
                raise Exception(
                    f"cannot find node {node} in {metadata.name}"
                )  # TODO use proper exception/error
        return metadata

    def _jsonify_metadata(
        self, metadata: imaspy.ids_metadata.IDSMetadata, recursive=False
    ) -> dict:
        """

        :param metadata:
        :param recursive:
        :return:
        """

        result = {}
        result["name"] = metadata.name
        result["type"] = metadata.data_type
        result["ndim"] = metadata.ndim
        result["shape"] = []  # empty for 0D data

        if recursive:
            result["children"] = [
                self._jsonify_metadata(child, recursive) for child in metadata
            ]
        else:
            result["children"] = [
                {"name": child.name, "type": child.data_type, "ndim": child.ndim}
                for child in metadata
            ]
        return result

    def get_node_info(self, uri: str, ids: str, node_path: str, recursive=False):
        """

        :param uri: pulsefile uri - used only to get proper DD version
        :param ids: name of ids e.g. core_profiles
        :param node_path: path to ids node e.g. ids_properties/version_put
        :param recursive: if True, creates node_info tree. if False, returns only pointed node and it's children node_info
        :return:
        """

        target_node = self._get_raw_data(uri, ids, node_path)
        metadata = target_node.metadata
        metadata_dict = self._jsonify_metadata(metadata, recursive)

        if isinstance(target_node, IDSStructArray) or isinstance(
            target_node, IDSString1D
        ):
            metadata_dict["shape"] = [len(target_node)]

        elif isinstance(target_node, imaspy.ids_primitive.IDSNumericArray):
            metadata_dict["shape"] = target_node.shape

        return metadata_dict

    def _extract_path_array_operator(self, single_node_path: str):
        """

        :param single_node_path:
        :return:
        """

        # pattern of code_parameters array access operator
        pattern = r"\[-?\d+\]"
        # first element of path with removed index (if existed)
        path_without_index = re.sub(pattern=pattern, repl="", string=single_node_path)

        index = None
        # search for index to extract it
        if re.search(pattern, single_node_path):
            array_index_string = re.search(pattern, single_node_path).group()
            index = int(re.search(r"-?\d+", array_index_string).group())

            if index < 0:
                raise IndexError("node_path index cannot be negative")

        return (path_without_index, index)

    def _get_raw_data(self, uri: str, ids: str, node_path: str):
        """

        :param uri:
        :param ids:
        :param node_path:
        :return:
        """

        entry = imaspy.DBEntry(uri, mode="r")
        ids = entry.get(ids, lazy=True)

        ids_data = ids

        if not node_path:
            return ids_data

        for node_name in node_path.split("/"):

            # extract array access operator from node_name
            (node_name_without_index, index) = self._extract_path_array_operator(
                node_name
            )

            for child in ids_data:
                if child.metadata.name == node_name_without_index:
                    ids_data = child
                    break
            else:
                raise NodeNotFoundException(
                    f"Cannot find node {node_name_without_index} in {ids_data.metadata.name}"
                )

            if index is not None and index > len(ids_data) - 1:
                raise IndexError(
                    f"Tried to access index [{index}] of {len(ids_data)}-element array (Node {ids_data.metadata.name})."
                )
            if index is not None:
                ids_data = ids_data[index]

        # entry.close()
        return ids_data

    def get_data(self, uri: str, ids: str, node_path: str, range):
        """

        :param uri:
        :param ids:
        :param node_path:
        :return:
        """

        ids_data = self._get_raw_data(uri, ids, node_path)

        if isinstance(ids_data, imaspy.ids_structure.IDSStructure):
            raise NotALeafNodeException(
                f"Path {node_path} does not point to a leaf node"
            )

        if isinstance(ids_data, str):
            return {"value": ids_data}

        if isinstance(ids_data.value, np.ndarray):
            return {"value": ids_data.value.tolist()}

        return {"value": ids_data.value}
