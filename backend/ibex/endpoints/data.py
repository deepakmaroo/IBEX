from typing import Sequence

from fastapi import APIRouter  # type: ignore

from ibex.core import ibex_service

router = APIRouter()


@router.get("/data/field_value/")
@ibex_service.measure_execution_time
async def field_value(
    uri: str, ids: str, node_path: str, range: Sequence[int] | None = None
) -> dict:
    return ibex_service.get_data(uri, ids, node_path, range)
