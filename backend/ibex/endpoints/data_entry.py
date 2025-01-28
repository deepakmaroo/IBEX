from typing import Optional

from fastapi import APIRouter, HTTPException  # type: ignore

from ibex.core import ibex_service

router = APIRouter()


@router.get("/data_entry/exists/")
@ibex_service.measure_execution_time
async def exists(uri: str) -> dict:
    return ibex_service.data_entry_exists(uri)


@router.get("/data_entry/list_idses/")
@ibex_service.measure_execution_time
async def list_idses(uri: str) -> dict:
    try:
        return ibex_service.list_idses(uri)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")


@router.get("/data_entry/available_entries/")
@ibex_service.measure_execution_time
async def available_entries(
    user: str = "public",
    backend: Optional[str] = "",
    database: Optional[str] = None,
    version: str = "3",
) -> dict:
    if not backend:
        backends = None
    else:
        backends = backend.split(" ")

    try:
        return ibex_service.list_db_entries(user, backends, database, int(version))
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"{e}")
