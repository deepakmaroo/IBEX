"""Endpoints extracting metadata from data source"""

from fastapi import APIRouter  # type: ignore

from ibex.core import ibex_service

router = APIRouter()


@router.get("/ids_info/node_info/")
@ibex_service.measure_execution_time
async def node_info(uri: str, show_error_bars: bool = False) -> dict:
    """
    IBEX endpoint. Returns metadata of a node (leaf or intermediate).

    Response JSON is constructed as follows:
    {
        "name": <node_name (str)>,
        "type": <type_of_data (str)>,
        "ndim": <number_of_data_dimensions (int)>,
        "shape": <data_shape (list(int))>,
        "children": <node_info_of_children_nodes (list(dict))>,
        "coordinates": <coordinates_names (list(str))>
    }
    """
    return ibex_service.get_node_info(uri.strip(), show_error_bars)


@router.get("/ids_info/find_paths/")
@ibex_service.measure_execution_time
async def find_field(uri: str, searched_node: str, show_error_bars: bool = False) -> dict:
    """
    IBEX endpoint. Returns list of nodes that have searched text within it's name.

    Response JSON is constructed as follows:
    {
      "paths": [
      <path_1 (str)>,
      <path_2 (str)>,
      ...
      <path_N (str)>,
      ]
    }
    """
    return ibex_service.find_paths(uri.strip(), searched_node, show_error_bars)


@router.get("/ids_info/array_summary/")
@ibex_service.measure_execution_time
async def array_summary(uri: str) -> dict:
    """
    IBEX endpoint. Returns summary of an array node.

    Response JSON is constructed as follows:
    {
        "shape": <data_shape (list(int))>
        "min": <minimum_value (float)>,
        "max": <maximum_value (float)>,
        "mean": <mean_value (float)>,
        "standard_deviation": <standard_deviation (float))>
    }
    """
    return ibex_service.array_summary(uri.strip())
