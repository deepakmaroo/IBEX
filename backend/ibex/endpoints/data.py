from typing import List

from fastapi import APIRouter, Query, HTTPException  # type: ignore

from ibex.core import ibex_service

router = APIRouter()


@router.get("/data/field_value/")
@ibex_service.measure_execution_time
async def field_value(uri: str, range: List[int] = Query(None)) -> dict:
    try:
        return ibex_service.get_data(uri, range)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")
