# Leaflet Mapas Interactivos Backend

Backend base con **FastAPI** y estructura **DDD**.

## Estructura

- `src/domain`: reglas y objetos del dominio.
- `src/application`: casos de uso y orquestacion.
- `src/infrastructure`: persistencia y servicios externos.
- `src/interfaces`: API HTTP, CLI, etc.
- `tests`: pruebas unitarias e integracion.

## Requisitos

- Python 3.10+

## Instalacion (PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Ejecutar API

```powershell
python main.py
```

O con uvicorn:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Endpoint inicial

- `GET /health`

