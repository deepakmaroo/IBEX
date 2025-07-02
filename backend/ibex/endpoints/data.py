"""Endpoints extracting data from data source"""

from typing import List

from fastapi import APIRouter, Query  # type: ignore

from ibex.core import ibex_service

router = APIRouter()


@router.get("/data/field_value/")
@ibex_service.measure_execution_time
async def field_value(uri: str, range: List[int] = Query(None)) -> dict:
    """
    IBEX endpoint. Checks if given URI points to pulsefile.
    """
    return ibex_service.get_data(uri.strip(), range)


@router.get("/data/plot_data")
@ibex_service.measure_execution_time
async def plot_data(uri: str) -> dict:
    """
    IBEX endpoint. Prepares and returns full information about data node and it's coordinates.
    """
    return ibex_service.get_plot_data(uri.strip())
