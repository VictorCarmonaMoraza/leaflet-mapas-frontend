from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from src.interfaces.api.routes.health import router as health_router
from src.interfaces.api.routes.examples import router as examples_router
from src.interfaces.api.routes.geocode import router as geocode_router
from src.interfaces.api.routes.db import router as db_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Leaflet Mapas Backend",
        version="0.1.0",
        description="API base con arquitectura DDD.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:4200",
            "http://127.0.0.1:4200",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(GZipMiddleware, minimum_size=1000)

    @app.get("/")
    def root() -> dict:
        return {
            "message": "API activa",
            "docs": "/docs",
            "health": "/health",
        }

    app.include_router(health_router)
    app.include_router(examples_router)
    app.include_router(geocode_router)
    app.include_router(db_router)
    return app


app = create_app()
