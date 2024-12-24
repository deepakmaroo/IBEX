from fastapi import FastAPI  # type: ignore

from ibex.endpoints.data import router as data_router
from ibex.endpoints.data_entry import router as data_entry_router
from ibex.endpoints.ids_info import router as ids_info_router

app = FastAPI()

app.include_router(data_entry_router)
app.include_router(ids_info_router)
app.include_router(data_router)
