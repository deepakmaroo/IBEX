from fastapi import APIRouter, HTTPException  # type: ignore

import ibex.core.ibex_service as lib

router = APIRouter()


@router.get("/ids_info/node_info/")
@lib.measure_execution_time
async def node_info(uri: str, ids: str, node_path: str = "") -> dict:
    return lib.get_node_info(uri, ids, node_path)
    """try:
        return core.get_node_info(uri, ids, node_path)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")"""


@router.get("/ids_info/ids_tree/")
@lib.measure_execution_time
async def ids_tree(uri: str, ids: str) -> dict:
    try:
        return lib.get_node_info(uri, ids, "", recursive=True)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")
