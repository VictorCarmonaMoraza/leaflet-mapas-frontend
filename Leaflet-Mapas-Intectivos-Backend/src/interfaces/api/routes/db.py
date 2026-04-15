from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from src.infrastructure.postgres import get_connection

router = APIRouter(prefix="/api/db", tags=["database"])


class MapNoteCreate(BaseModel):
    username: str | None = Field(default=None, max_length=50)
    name: str = Field(min_length=1, max_length=120)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    comment: str = Field(min_length=1, max_length=2000)


class MapNoteMove(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    username: str | None = Field(default=None, max_length=50)


@router.get("/health")
def db_health() -> dict:
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 AS ok")
                row = cur.fetchone()
        return {
            "status": "ok",
            "database": "connected",
            "result": row,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Database connection failed: {exc}") from exc


@router.get("/ubicaciones")
def get_ubicaciones(
    activa: bool = Query(True),
    categoria: str | None = Query(None),
) -> list[dict]:
    query = """
        SELECT id, codigo, nombre, latitud, longitud, zoom, categoria, descripcion, activa
        FROM public.ubicaciones
                WHERE (%(activa)s::boolean IS FALSE OR activa = TRUE)
                    AND (%(categoria)s::text IS NULL OR categoria = %(categoria)s::text)
        ORDER BY categoria, nombre
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"activa": activa, "categoria": categoria})
                rows = cur.fetchall()
        return rows
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to load ubicaciones: {exc}") from exc


@router.get("/rutas/{codigo}")
def get_ruta(codigo: str) -> dict:
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, codigo, nombre, descripcion, activa
                    FROM public.rutas
                    WHERE codigo = %s
                    """,
                    (codigo,),
                )
                ruta = cur.fetchone()

                if not ruta:
                    raise HTTPException(
                        status_code=404, detail="Ruta no encontrada")

                cur.execute(
                    """
                    SELECT orden, latitud, longitud, etiqueta
                    FROM public.ruta_puntos
                    WHERE ruta_id = %s
                    ORDER BY orden
                    """,
                    (ruta["id"],),
                )
                puntos = cur.fetchall()

        return {
            "ruta": ruta,
            "puntos": puntos,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to load ruta: {exc}") from exc


@router.get("/notas")
def get_map_notes(username: str | None = Query(None)) -> list[dict]:
    query = """
        SELECT
            id,
            username,
            ciudad_nombre AS name,
            latitud AS lat,
            longitud AS lng,
            comentario AS comment,
            created_at
        FROM public.notas_mapa
        WHERE (%(username)s::text IS NULL OR username = %(username)s::text)
        ORDER BY created_at DESC, id DESC
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, {"username": username})
                rows = cur.fetchall()
        return rows
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to load map notes: {exc}") from exc


@router.post("/notas", status_code=201)
def create_map_note(payload: MapNoteCreate) -> dict:
    query = """
        INSERT INTO public.notas_mapa (username, ciudad_nombre, latitud, longitud, comentario)
        VALUES (%(username)s, %(name)s, %(lat)s, %(lng)s, %(comment)s)
        RETURNING
            id,
            username,
            ciudad_nombre AS name,
            latitud AS lat,
            longitud AS lng,
            comentario AS comment,
            created_at
    """

    params = {
        "username": payload.username.strip() if payload.username else None,
        "name": payload.name.strip(),
        "lat": payload.lat,
        "lng": payload.lng,
        "comment": payload.comment.strip(),
    }

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)
                note = cur.fetchone()
            conn.commit()
        return note
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to save map note: {exc}") from exc


@router.put("/notas/{note_id}/posicion")
def move_map_note(note_id: int, payload: MapNoteMove) -> dict:
    query = """
        UPDATE public.notas_mapa
        SET latitud = %(lat)s,
            longitud = %(lng)s,
            updated_at = NOW()
        WHERE id = %(note_id)s
          AND (%(username)s::text IS NULL OR username = %(username)s::text)
        RETURNING
            id,
            username,
            ciudad_nombre AS name,
            latitud AS lat,
            longitud AS lng,
            comentario AS comment,
            created_at,
            updated_at
    """

    params = {
        "note_id": note_id,
        "lat": payload.lat,
        "lng": payload.lng,
        "username": payload.username.strip() if payload.username else None,
    }

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)
                note = cur.fetchone()
            conn.commit()

        if not note:
            raise HTTPException(status_code=404, detail="Nota no encontrada")

        return note
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to move map note: {exc}") from exc


@router.delete("/notas/{note_id}", status_code=204)
def delete_map_note(note_id: int, username: str | None = Query(None)) -> None:
    query = """
        DELETE FROM public.notas_mapa
        WHERE id = %(note_id)s
          AND (%(username)s::text IS NULL OR username = %(username)s::text)
        RETURNING id
    """

    params = {
        "note_id": note_id,
        "username": username.strip() if username else None,
    }

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)
                deleted = cur.fetchone()
            conn.commit()

        if not deleted:
            raise HTTPException(status_code=404, detail="Nota no encontrada")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete map note: {exc}") from exc
