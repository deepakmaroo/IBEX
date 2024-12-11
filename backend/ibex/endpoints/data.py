from fastapi import APIRouter  # type: ignore

import ibex.core.ibex_service as lib

router = APIRouter()


@router.get("/data/field_value/")
@lib.measure_execution_time
async def field_value(uri: str, ids: str, node_path: str, range=[]):
    return lib.get_data(uri, ids, node_path, range)
