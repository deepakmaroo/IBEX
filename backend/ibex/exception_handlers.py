import traceback  # type: ignore
import logging  # type: ignore
from fastapi import Request  # type: ignore
from fastapi.responses import JSONResponse  # type: ignore

logger = logging.getLogger(__name__)


# Unfortunately general exception handler cannot catch some of Exception types, so more specific handlers had to be implemented
# https://github.com/fastapi/fastapi/discussions/11738
async def general_exception_handler(request: Request, exc: Exception):
    code = 404
    logger.error(traceback.format_exc())
    return JSONResponse(status_code=code, content={"message": str(exc)})


async def value_error_handler(request: Request, exc: ValueError):
    code = 404
    logger.error(traceback.format_exc())
    return JSONResponse(status_code=code, content={"message": str(exc)})


async def key_error_handler(request: Request, exc: KeyError):
    code = 404
    logger.error(traceback.format_exc())
    return JSONResponse(status_code=code, content={"message": str(exc)})


async def runtime_error_handler(request: Request, exc: RuntimeError):
    code = 404
    logger.error(traceback.format_exc())
    return JSONResponse(status_code=code, content={"message": str(exc)})
