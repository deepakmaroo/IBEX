from typing import List

from fastapi import APIRouter, HTTPException, Query  # type: ignore

from ibex.core import ibex_service

router = APIRouter()


@router.get("/data/field_value/")
@ibex_service.measure_execution_time
async def field_value(uri: str, range: List[int] = Query(None)) -> dict:
    try:
        return ibex_service.get_data(uri, range)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")


@router.get("/data/multiple_values/")
@ibex_service.measure_execution_time
async def multiple_values(uri: str) -> dict:
    try:
        return ibex_service.get_multiple_node_data(uri)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")
