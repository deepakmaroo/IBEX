from ibex.data_source.imaspy_source import IMASPySource
from functools import wraps  # for measure_execution_time()

data_source = IMASPySource()


# helper decorator used during development
# TODO to be deleted before release
def measure_execution_time(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        response = await func(*args, **kwargs)
        end_time = time.perf_counter()
        execution_time = end_time - start_time
        print(
            f"==========> Endpoint '{func.__name__}' executed in {execution_time:.4f} seconds"
        )
        return response

    return wrapper


def data_entry_exists(uri: str):
    return data_source.data_entry_exists(uri)


def get_node_info(uri: str, ids: str, node_path: str, recursive: bool = False):
    return data_source.get_node_info(uri, ids, node_path, recursive)


def get_data(uri: str, ids: str, node_path: str, range):
    return data_source.get_data(uri, ids, node_path, range)


def list_idses(uri: str):
    return data_source.list_idses(uri)
