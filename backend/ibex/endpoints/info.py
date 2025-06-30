"""Endpoints returning informations about server"""

from fastapi import APIRouter  # type: ignore

from ibex.core import ibex_service
from ibex import __version__

router = APIRouter()


@router.get("/info/version/")
@ibex_service.measure_execution_time
async def version() -> dict:
    """
    IBEX endpoint. Returns backend version
    """
    res = {"version": str(__version__)}
    return res
