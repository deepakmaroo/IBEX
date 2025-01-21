import time
from functools import wraps  # for measure_execution_time()
from typing import Any, Callable, Optional, Sequence, List

from ibex.data_source.imaspy_source import IMASPySource
from dataclasses import dataclass


@dataclass
class URI:
    full_uri: str = ""

    uri_entry_identifiers: str = ""
    uri_fragment: str = ""

    ids_name: str = ""
    node_path: str = ""
    occurrence: int = 0

    def __init__(self, full_uri):
        self.full_uri = full_uri

        if "#" not in full_uri:
            self.uri_entry_identifiers = full_uri
            return

        # Split the URI into base and fragment parts
        base_uri, fragment = full_uri.split("#", 1)
        self.uri_entry_identifiers = base_uri
        self.uri_fragment = fragment

        if ":" in fragment:
            # Split the fragment into ids_name and the rest of the string after the colon
            ids_name, remaining = fragment.split(":", 1)
            self.ids_name = ids_name

            # If the remaining part contains a slash, split it into occurrence and node_path
            if "/" in remaining:
                self.occurrence, self.node_path = remaining.split("/", 1)
            else:
                self.occurrence = remaining
        else:
            # If the fragment contains a slash, split it into ids_name and node_path
            if "/" in fragment:
                self.ids_name, self.node_path = fragment.split("/", 1)
            else:
                self.ids_name = fragment

    def __str__(self):
        return (
            f"FULL URI   : {self.full_uri}\n"
            f"URI        : {self.uri_entry_identifiers}\n"
            f"FRAGMENT   : {self.uri_fragment}\n"
            f"IDS        : {self.ids_name}\n"
            f"OCCURRENCE : {self.occurrence}\n"
            f"NODE_PATH  : {self.node_path}\n"
        )


data_source = IMASPySource()


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
    uri_obj = URI(uri)
    return {"exists": data_source.data_entry_exists(uri_obj.uri_entry_identifiers)}


def get_node_info(uri: str, recursive: bool = False) -> dict:
    uri_obj = URI(uri)
    return data_source.get_node_info(
        uri_obj.uri_entry_identifiers, uri_obj.ids_name, uri_obj.node_path, uri_obj.occurrence, recursive
    )


def get_data(uri: str, range: List[int]) -> dict:
    uri_obj = URI(uri)
    return data_source.get_data(
        uri_obj.uri_entry_identifiers, uri_obj.ids_name, uri_obj.node_path, uri_obj.occurrence, range
    )


def list_idses(uri: str) -> dict:
    uri_obj = URI(uri)
    return data_source.list_idses(uri_obj.uri_entry_identifiers)


def find_paths(uri: str, searched_node: str) -> dict:
    uri_obj = URI(uri)
    return data_source.find_paths(uri_obj.uri_entry_identifiers, uri_obj.ids_name, searched_node)


def array_summary(uri: str) -> dict:
    uri_obj = URI(uri)
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
