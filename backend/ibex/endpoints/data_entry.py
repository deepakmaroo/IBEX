from fastapi import APIRouter  # type: ignore

import ibex.core.ibex_service as lib

router = APIRouter()


@router.get("/data_entry/exists/")
@lib.measure_execution_time
async def exists(uri: str) -> dict:
    return lib.data_entry_exists(uri)


@router.get("/data_entry/list_idses/")
@lib.measure_execution_time
async def list_idses(uri: str) -> dict:
    return lib.list_idses(uri)


@router.get("/data_entry/available_entries/")
@lib.measure_execution_time
async def available_entries(
    user: str = "", backend: str = "", database: str = "", version: str = ""
) -> dict:
    return {
        "entries": [
            "imas:hdf5?user=public;pulse=135011;run=7;database=iterdb;version=3",
            "imas:hdf5?user=public;pulse=135012;run=2;database=iterdb;version=3",
            "imas:mdsplus?user=public;pulse=400;run=20;database=validation;version=3",
            "imas:mdsplus?user=public;pulse=53223;run=0;database=validation;version=3",
        ]
    }
