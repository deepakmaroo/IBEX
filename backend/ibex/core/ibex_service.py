"""Logic between endpoint and data sources"""

import time
import re
from functools import wraps  # for measure_execution_time()
from typing import Any, Callable, Optional, Sequence, List

from ibex.data_source.imas_python_source import IMASPythonSource
from dataclasses import dataclass


@dataclass
class IMAS_URI:
    """
    Helper class to extract arguments from imas uri
    """

    #: Full URI containing pulse file identifier, ids name and path to node
    full_uri: str = ""

    #: pulse file identifier extracted from full URI
    uri_entry_identifiers: str = ""
    #: fragment part from full URI containing ids name and path to node
    uri_fragment: str = ""
    #: ids name extracted from full URI
    ids_name: str = ""
    #: path to node extracted from full URI
    node_path: str = ""
    #: ids occurrence number extracted from full URI
    occurrence: int = 0

    def __init__(self, full_uri):
        """
        IMAS_URI constructor
        :param full_uri: pulsefile uri along with #fragment part
        """

        self.full_uri = full_uri

        if "#" not in self.full_uri:
            self.uri_entry_identifiers = self.full_uri
            return

        self.uri_entry_identifiers, self.uri_fragment = self.full_uri.split("#", 1)

        pattern = r"^(?P<idsname>[^:/]+)(?::(?P<occurrence>[^/]*))?(?:/(?P<node_path>.*))?$"

        match = re.match(pattern, self.uri_fragment)

        if not match:
            return

        self.ids_name = match.group("idsname") if match.group("idsname") else ""
        self.occurrence = match.group("occurrence") if match.group("occurrence") else 0
        self.node_path = match.group("node_path") if match.group("node_path") else ""

    def __str__(self):
        return (
            f"FULL URI   : {self.full_uri}\n"
            f"URI        : {self.uri_entry_identifiers}\n"
            f"FRAGMENT   : {self.uri_fragment}\n"
            f"IDS        : {self.ids_name}\n"
            f"OCCURRENCE : {self.occurrence}\n"
            f"NODE_PATH  : {self.node_path}\n"
        )


data_source = IMASPythonSource()


# helper decorator used during development
# TODO to be deleted before release
def measure_execution_time(func: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        start_time = time.perf_counter()
        response = await func(*args, **kwargs)
        end_time = time.perf_counter()
        execution_time = end_time - start_time
        print(f"==========> Endpoint '{func.__name__}' executed in {execution_time:.4f} seconds")
        return response

    return wrapper


def data_entry_exists(uri: str) -> dict:
    uri_obj = IMAS_URI(uri)
    return {"exists": data_source.data_entry_exists(uri_obj.uri_entry_identifiers)}


def get_node_info(uri: str, recursive: bool = False, show_error_bars: bool = False) -> dict:
    uri_obj = IMAS_URI(uri)
    return data_source.get_node_info(
        uri_obj.uri_entry_identifiers,
        uri_obj.ids_name,
        uri_obj.node_path,
        uri_obj.occurrence,
        recursive,
        show_error_bars,
    )


def get_data(uri: str, downsampling_method: str | None, downsampled_size: int, range: List[int]) -> dict:
    uri_obj = IMAS_URI(uri)
    return data_source.get_data(
        uri_obj.uri_entry_identifiers,
        uri_obj.ids_name,
        uri_obj.node_path,
        uri_obj.occurrence,
        range,
        downsampling_method,
        downsampled_size,
    )


def list_idses(uri: str) -> dict:
    uri_obj = IMAS_URI(uri)
    return data_source.list_idses(uri_obj.uri_entry_identifiers)


def find_paths(uri: str, searched_node: str, show_error_bars: bool = False) -> dict:
    uri_obj = IMAS_URI(uri)
    return data_source.find_paths(uri_obj.uri_entry_identifiers, searched_node, show_error_bars)


def array_summary(uri: str) -> dict:
    uri_obj = IMAS_URI(uri)
    return data_source.array_summary(
        uri_obj.uri_entry_identifiers, uri_obj.ids_name, uri_obj.node_path, uri_obj.occurrence
    )


def list_db_entries(
    user: str,
    backends: Optional[Sequence[str]] = None,
    database: Optional[str] = None,
    version: Optional[int] = None,
) -> dict:
    return data_source.list_db_entries(user, backends, database, version)


def get_multiple_node_data(uri: str) -> dict:
    uri_obj = IMAS_URI(uri)
    return data_source.get_multiple_node_data(
        uri_obj.uri_entry_identifiers, uri_obj.ids_name, uri_obj.node_path, uri_obj.occurrence
    )


def get_plot_data(uri: str, downsampling_method: str | None, downsampled_size: int) -> dict:
    uri_obj = IMAS_URI(uri)
    return data_source.get_plot_data(
        uri_obj.uri_entry_identifiers,
        uri_obj.ids_name,
        uri_obj.node_path,
        uri_obj.occurrence,
        downsampling_method,
        downsampled_size,
    )
