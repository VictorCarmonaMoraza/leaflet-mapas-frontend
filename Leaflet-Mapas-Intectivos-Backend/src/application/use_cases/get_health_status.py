class GetHealthStatusUseCase:
    def execute(self) -> dict:
        return {
            "status": "ok",
            "service": "leaflet-mapas-backend",
        }

