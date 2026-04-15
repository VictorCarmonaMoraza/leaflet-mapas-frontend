from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
import httpx

router = APIRouter(prefix="/api/geocode", tags=["geocode"])

COMMUNITY_PROVINCES: dict[str, list[str]] = {
    "andalucia": ["Almeria", "Cadiz", "Cordoba", "Granada", "Huelva", "Jaen", "Malaga", "Sevilla"],
    "aragon": ["Huesca", "Teruel", "Zaragoza"],
    "asturias": ["Asturias"],
    "principado de asturias": ["Asturias"],
    "islas baleares": ["Illes Balears"],
    "illes balears": ["Illes Balears"],
    "canarias": ["Las Palmas", "Santa Cruz de Tenerife"],
    "cantabria": ["Cantabria"],
    "castilla y leon": ["Avila", "Burgos", "Leon", "Palencia", "Salamanca", "Segovia", "Soria", "Valladolid", "Zamora"],
    "castilla-la mancha": ["Albacete", "Ciudad Real", "Cuenca", "Guadalajara", "Toledo"],
    "castilla la mancha": ["Albacete", "Ciudad Real", "Cuenca", "Guadalajara", "Toledo"],
    "cataluna": ["Barcelona", "Girona", "Lleida", "Tarragona"],
    "catalunya": ["Barcelona", "Girona", "Lleida", "Tarragona"],
    "comunitat valenciana": ["Alicante", "Castellon", "Valencia"],
    "comunidad valenciana": ["Alicante", "Castellon", "Valencia"],
    "extremadura": ["Badajoz", "Caceres"],
    "galicia": ["A Coruna", "Lugo", "Ourense", "Pontevedra"],
    "madrid": ["Madrid"],
    "comunidad de madrid": ["Madrid"],
    "murcia": ["Murcia"],
    "region de murcia": ["Murcia"],
    "navarra": ["Navarra"],
    "comunidad foral de navarra": ["Navarra"],
    "pais vasco": ["Alava", "Bizkaia", "Gipuzkoa"],
    "euskadi": ["Alava", "Bizkaia", "Gipuzkoa"],
    "la rioja": ["La Rioja"],
    "ceuta": ["Ceuta"],
    "melilla": ["Melilla"],
}


def _normalize_key(value: str) -> str:
    normalized = value.lower().strip()
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
    }
    for old, new in replacements.items():
        normalized = normalized.replace(old, new)
    return " ".join(normalized.split())


def _is_reasonable_feature(feature: dict) -> bool:
    geometry_type = feature.get("geometry", {}).get("type")
    if geometry_type not in {"Polygon", "MultiPolygon"}:
        return False

    bbox = feature.get("bbox")
    if not bbox or len(bbox) != 4:
        return True

    min_lon, min_lat, max_lon, max_lat = bbox
    lon_span = abs(max_lon - min_lon)
    lat_span = abs(max_lat - min_lat)
    # Provincias espanolas nunca deben ocupar una extension tan grande.
    return lon_span <= 8 and lat_span <= 8


@router.get("/search")
async def search_place(
    q: str = Query(..., min_length=1),
    format: str = Query("json", pattern="^(json|geojson)$"),
    limit: int = Query(5, ge=1, le=20),
    polygon_geojson: int | None = Query(None),
    countrycodes: str | None = Query(None),
    lang: str = Query("es"),
) -> JSONResponse:
    params: dict[str, str | int] = {
        "q": q,
        "format": format,
        "limit": limit,
    }

    if polygon_geojson is not None:
        params["polygon_geojson"] = polygon_geojson
    if countrycodes:
        params["countrycodes"] = countrycodes

    headers = {
        "Accept": "application/json",
        "Accept-Language": lang,
        "User-Agent": "leaflet-mapas-backend/0.1.0",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params=params,
                headers=headers,
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Nominatim unavailable: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502, detail="Nominatim returned an error")

    return JSONResponse(status_code=200, content=response.json())


@router.get("/provinces/by-community")
async def provinces_by_community(
    community: str = Query(..., min_length=2),
    lang: str = Query("es"),
) -> JSONResponse:
    key = _normalize_key(community)
    provinces = COMMUNITY_PROVINCES.get(key)
    if not provinces:
        raise HTTPException(status_code=404, detail="Community not supported")

    headers = {
        "Accept": "application/json",
        "Accept-Language": lang,
        "User-Agent": "leaflet-mapas-backend/0.1.0",
    }

    features: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            for province in provinces:
                params = {
                    "q": f"{province}, Spain",
                    "format": "geojson",
                    "limit": 1,
                    "polygon_geojson": 1,
                    "countrycodes": "es",
                }
                response = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params=params,
                    headers=headers,
                )
                if response.status_code >= 400:
                    continue

                data = response.json()
                feature = (data.get("features") or [None])[0]
                if not feature or not _is_reasonable_feature(feature):
                    continue

                properties = dict(feature.get("properties") or {})
                properties["province"] = province
                properties["community"] = community
                feature["properties"] = properties
                features.append(feature)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"Province lookup unavailable: {exc}") from exc

    return JSONResponse(
        status_code=200,
        content={
            "type": "FeatureCollection",
            "features": features,
        },
    )
