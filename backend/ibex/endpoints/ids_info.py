"""Endpoints extracting metadata from data source"""

from fastapi import APIRouter  # type: ignore

from ibex.core import ibex_service

router = APIRouter()


@router.get("/ids_info/node_info/")
@ibex_service.measure_execution_time
async def node_info(uri: str, show_error_bars: bool = False) -> dict:
    """
    IBEX endpoint. Returns metadata of a node (leaf or intermediate).
    """
    return ibex_service.get_node_info(uri, show_error_bars)


@router.get("/ids_info/find_paths/")
@ibex_service.measure_execution_time
async def find_field(uri: str, searched_node: str, show_error_bars: bool = False) -> dict:
    """
    IBEX endpoint. Returns list of nodes that have searched text within it's name.
    """
    return ibex_service.find_paths(uri, searched_node, show_error_bars)


@router.get("/ids_info/array_summary/")
@ibex_service.measure_execution_time
async def array_summary(uri: str) -> dict:
    """
    IBEX endpoint. Returns summary of an array node.
    """
    return ibex_service.array_summary(uri)
