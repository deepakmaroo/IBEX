import traceback  # type: ignore
import logging  # type: ignore
from fastapi import Request  # type: ignore
from fastapi.responses import JSONResponse  # type: ignore

logger = logging.getLogger(__name__)


async def general_exception_handler(request: Request, exc: Exception):
    try:
        code = exc.code
    except AttributeError:
        code = 404
    logger.error(traceback.format_exc())
    return JSONResponse(status_code=code, content={"message": str(exc)})
