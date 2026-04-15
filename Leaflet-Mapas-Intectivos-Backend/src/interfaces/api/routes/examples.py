from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/examples", tags=["examples"])

ALLOWED_FILES = {
    "argis-water-pipes-spain.geojson",
    "spain-ccaa.geojson",
    "world-countries.geojson",
    "world-countries.simplified.geojson",
}


def _examples_dir() -> Path:
    backend_root = Path(__file__).resolve().parents[4]
    return (backend_root / ".." / "leaflet-maps" / "public" / "examples").resolve()


@router.get("/{file_name}")
def get_example_geojson(file_name: str) -> FileResponse:
    if file_name not in ALLOWED_FILES:
        raise HTTPException(status_code=404, detail="Example file not found")

    path = _examples_dir() / file_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Example file not found")

    return FileResponse(
        path,
        media_type="application/geo+json",
        filename=file_name,
        headers={
            "Cache-Control": "public, max-age=3600",
        },
    )
