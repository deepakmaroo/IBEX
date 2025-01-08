from abc import ABC, abstractmethod
from typing import Sequence


class DataSourceInterface(ABC):
    @abstractmethod
    def data_entry_exists(self, uri: str) -> bool:
        """

        :param uri:
        :return:
        """
        ...

    @abstractmethod
    def list_idses(self, uri: str) -> dict:
        """

        :param uri:
        :return:
        """
        ...

    @abstractmethod
    def get_node_info(self, uri: str, ids: str, node_path: str, recursive: bool = False) -> dict:
        """

        :param uri: pulsefile uri - used only to get proper DD version
        :param ids: name of ids e.g. core_profiles
        :param node_path: path to ids node e.g. ids_properties/version_put
        :param recursive: if True, creates node_info tree.
            if False, returns only pointed node and it's children node_info
        :return:
        """
        ...

    @abstractmethod
    def get_data(self, uri: str, ids: str, node_path: str, range: Sequence | None) -> dict:
        """

        :param uri:
        :param ids:
        :param node_path:
        :return:
        """
        ...
