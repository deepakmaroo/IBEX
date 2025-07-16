"""Endpoints extracting data from data source"""

from typing import List

from fastapi import APIRouter, Query  # type: ignore

from ibex.core import ibex_service

router = APIRouter()


@router.get("/data/field_value")
@ibex_service.measure_execution_time
async def field_value(
    uri: str, downsampling_method: str | None = None, downsampled_size: int = 1000, range: List[int] = Query(None)
) -> dict:
    """
    IBEX endpoint. Checks if given URI points to pulsefile.
    """
    return ibex_service.get_data(uri.strip(), downsampling_method, downsampled_size, range)


@router.get("/data/plot_data")
@ibex_service.measure_execution_time
async def plot_data(uri: str, downsampling_method: str | None = None, downsampled_size: int = 1000) -> dict:
    """
    IBEX endpoint. Prepares and returns full information about data node and it's coordinates.
    """
    return ibex_service.get_plot_data(uri.strip(), downsampling_method, downsampled_size)
