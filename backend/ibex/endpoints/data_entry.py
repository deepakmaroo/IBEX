"""Endpoints extracting auxiliary info from data source"""

from typing import Optional

from fastapi import APIRouter  # type: ignore

from ibex.core import ibex_service

router = APIRouter()


@router.get("/data_entry/exists/")
@ibex_service.measure_execution_time
async def exists(uri: str) -> dict:
    """
    IBEX endpoint. Checks if pulsefile exists and can be opened.
    """
    return ibex_service.data_entry_exists(uri.strip())


@router.get("/data_entry/list_idses/")
@ibex_service.measure_execution_time
async def list_idses(uri: str) -> dict:
    """
    IBEX endpoint. Returns list of available IDSes and occurrences from pulsefile.
    """
    return ibex_service.list_idses(uri.strip())


@router.get("/data_entry/available_entries/")
@ibex_service.measure_execution_time
async def available_entries(
    user: str = "public",
    backend: Optional[str] = "",
    database: Optional[str] = None,
    version: str = "3",
) -> dict:
    """
    IBEX endpoint. Returns list of available pulsefiles from current filesystem
    """
    if not backend:
        backends = None
    else:
        backends = backend.split(" ")

    return ibex_service.list_db_entries(user, backends, database, int(version))
