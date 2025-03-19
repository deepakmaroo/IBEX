from fastapi import FastAPI  # type: ignore
import logging  # type: ignore

from ibex.endpoints.data import router as data_router
from ibex.endpoints.data_entry import router as data_entry_router
from ibex.endpoints.ids_info import router as ids_info_router

from .exception_handlers import general_exception_handler, value_error_handler, key_error_handler, runtime_error_handler

logger = logging.getLogger(__name__)

app = FastAPI()

app.include_router(data_entry_router)
app.include_router(ids_info_router)
app.include_router(data_router)

app.add_exception_handler(Exception, general_exception_handler)
app.add_exception_handler(ValueError, value_error_handler)
app.add_exception_handler(KeyError, key_error_handler)
app.add_exception_handler(RuntimeError, runtime_error_handler)
