import time
from functools import wraps  # for measure_execution_time()
from typing import Any, Callable, Sequence

from ibex.data_source.imaspy_source import IMASPySource

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
        print(
            f"==========> Endpoint '{func.__name__}' executed in {execution_time:.4f} seconds"
        )
        return response

    return wrapper


def data_entry_exists(uri: str) -> dict:
    return {"exists": data_source.data_entry_exists(uri)}


def get_node_info(uri: str, ids: str, node_path: str, recursive: bool = False) -> dict:
    return data_source.get_node_info(uri, ids, node_path, recursive)


def get_data(
    uri: str, ids: str, node_path: str, range: Sequence[int] | None = None
) -> dict:
    return data_source.get_data(uri, ids, node_path, range)


def list_idses(uri: str) -> dict:
    return data_source.list_idses(uri)


def find_paths(uri: str, ids: str, node_path: str) -> dict:
    return data_source.find_paths(uri, ids, node_path)
