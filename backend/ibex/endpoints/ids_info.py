from fastapi import APIRouter, HTTPException  # type: ignore

from ibex.core import ibex_service

router = APIRouter()


@router.get("/ids_info/node_info/")
@ibex_service.measure_execution_time
async def node_info(uri: str, ids: str, node_path: str = "") -> dict:
    try:
        return ibex_service.get_node_info(uri, ids, node_path)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")


@router.get("/ids_info/ids_tree/")
@ibex_service.measure_execution_time
async def ids_tree(uri: str, ids: str) -> dict:
    try:
        return ibex_service.get_node_info(uri, ids, "", recursive=True)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")


@router.get("/ids_info/find_paths/")
@ibex_service.measure_execution_time
async def find_field(uri: str, ids: str, node_regex: str) -> dict:
    try:
        return ibex_service.find_paths(uri, ids, node_regex)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")
