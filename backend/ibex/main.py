from fastapi import FastAPI, Request  # type: ignore
from fastapi.responses import JSONResponse  # type: ignore
import logging  # type: ignore

from ibex.endpoints.data import router as data_router
from ibex.endpoints.data_entry import router as data_entry_router
from ibex.endpoints.ids_info import router as ids_info_router

logger = logging.getLogger(__name__)

app = FastAPI()

app.include_router(data_entry_router)
app.include_router(ids_info_router)
app.include_router(data_router)


@app.exception_handler(Exception)
async def custom_exception_handler(request: Request, exc: Exception):
    """
    :param request: Received request
    :param exc: Raised exception
    :return: JSONResponse to be sent to frontend
    """
    code = 404
    if hasattr(exc, "code"):
        code = exc.code
    logger.error(f"{exc}")
    return JSONResponse(status_code=code, content={"message": repr(exc)})
