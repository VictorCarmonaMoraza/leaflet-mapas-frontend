-- ============================================================
-- SCRIPT POSTGRESQL PARA PGADMIN
-- Proyecto: Leaflet-Mapas-Interactivos
-- Objetivo: crear BD, tablas y cargar ubicaciones hardcodeadas
-- Fecha: 2026-04-11
-- ============================================================

/*
  PASO 1 (ejecutar en la base "postgres" o en otra BD administrativa):
  ----------------------------------------------------------------------
  CREATE DATABASE leaflet_maps_db;

  Si la BD ya existe, omite el CREATE DATABASE.

  PASO 2:
  ------
  En pgAdmin, abre Query Tool sobre la BD "leaflet_maps_db"
  y ejecuta TODO el resto de este archivo (desde CREATE SCHEMA ...).
*/

CREATE SCHEMA IF NOT EXISTS app;

-- ============================================================
-- TABLA 1: ubicaciones
-- Guarda ciudades y centros predefinidos del frontend
-- ============================================================
CREATE TABLE IF NOT EXISTS app.ubicaciones (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  latitud NUMERIC(9,6) NOT NULL,
  longitud NUMERIC(9,6) NOT NULL,
  zoom SMALLINT NOT NULL DEFAULT 13,
  categoria VARCHAR(30) NOT NULL DEFAULT 'ciudad',
  descripcion VARCHAR(255),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_ubicaciones_latitud CHECK (latitud BETWEEN -90 AND 90),
  CONSTRAINT ck_ubicaciones_longitud CHECK (longitud BETWEEN -180 AND 180),
  CONSTRAINT ck_ubicaciones_zoom CHECK (zoom BETWEEN 0 AND 22)
);

CREATE INDEX IF NOT EXISTS idx_ubicaciones_categoria ON app.ubicaciones (categoria);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_nombre ON app.ubicaciones (nombre);

-- ============================================================
-- TABLA 2: rutas
-- Guarda rutas de ejemplo entre ubicaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS app.rutas (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  descripcion VARCHAR(255),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA 3: ruta_puntos
-- Guarda la secuencia de coordenadas de cada ruta
-- ============================================================
CREATE TABLE IF NOT EXISTS app.ruta_puntos (
  id BIGSERIAL PRIMARY KEY,
  ruta_id BIGINT NOT NULL REFERENCES app.rutas(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  latitud NUMERIC(9,6) NOT NULL,
  longitud NUMERIC(9,6) NOT NULL,
  etiqueta VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ruta_puntos_orden UNIQUE (ruta_id, orden),
  CONSTRAINT ck_ruta_puntos_latitud CHECK (latitud BETWEEN -90 AND 90),
  CONSTRAINT ck_ruta_puntos_longitud CHECK (longitud BETWEEN -180 AND 180)
);

CREATE INDEX IF NOT EXISTS idx_ruta_puntos_ruta_id ON app.ruta_puntos (ruta_id);

-- ============================================================
-- DATOS INICIALES (UPSERT)
-- Ubicaciones hardcodeadas detectadas en el frontend:
-- MADRID, BARCELONA, VALENCIA, SEVILLA, BILBAO, ESPANA
-- ============================================================
INSERT INTO app.ubicaciones (codigo, nombre, latitud, longitud, zoom, categoria, descripcion)
VALUES
  ('MADRID', 'Madrid', 40.4168, -3.7038, 13, 'ciudad', 'Capital de Espana'),
  ('BARCELONA', 'Barcelona', 41.3851, 2.1734, 13, 'ciudad', 'Cataluna'),
  ('VALENCIA', 'Valencia', 39.4699, -0.3763, 13, 'ciudad', 'Levante'),
  ('SEVILLA', 'Sevilla', 37.3891, -5.9845, 13, 'ciudad', 'Andalucia'),
  ('BILBAO', 'Bilbao', 43.2627, -2.9253, 13, 'ciudad', 'Pais Vasco'),
  ('ESPANA', 'Espana', 40.0000, -3.0000, 6, 'pais', 'Centro aproximado de Espana')
ON CONFLICT (codigo) DO UPDATE
SET
  nombre = EXCLUDED.nombre,
  latitud = EXCLUDED.latitud,
  longitud = EXCLUDED.longitud,
  zoom = EXCLUDED.zoom,
  categoria = EXCLUDED.categoria,
  descripcion = EXCLUDED.descripcion,
  updated_at = NOW();

-- Ruta hardcodeada del ejemplo avanzado: Madrid -> Centro -> Barcelona
INSERT INTO app.rutas (codigo, nombre, descripcion)
VALUES ('RUTA_MADRID_BARCELONA', 'Ruta Madrid - Barcelona', 'Ruta de ejemplo del componente advanced-map')
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    updated_at = NOW();

-- Reemplazar puntos para mantener consistencia al re-ejecutar
DELETE FROM app.ruta_puntos
WHERE ruta_id = (SELECT id FROM app.rutas WHERE codigo = 'RUTA_MADRID_BARCELONA');

INSERT INTO app.ruta_puntos (ruta_id, orden, latitud, longitud, etiqueta)
SELECT r.id, v.orden, v.latitud, v.longitud, v.etiqueta
FROM app.rutas r
JOIN (
  VALUES
    (1, 40.4168::NUMERIC(9,6), -3.7038::NUMERIC(9,6), 'Madrid'),
    (2, 41.0082::NUMERIC(9,6), -3.6352::NUMERIC(9,6), 'Centro'),
    (3, 41.3851::NUMERIC(9,6), 2.1734::NUMERIC(9,6), 'Barcelona')
) AS v(orden, latitud, longitud, etiqueta)
ON TRUE
WHERE r.codigo = 'RUTA_MADRID_BARCELONA';

-- ============================================================
-- VISTA DE CONSULTA RAPIDA
-- ============================================================
CREATE OR REPLACE VIEW app.v_ubicaciones_activas AS
SELECT
  id,
  codigo,
  nombre,
  latitud,
  longitud,
  zoom,
  categoria,
  descripcion
FROM app.ubicaciones
WHERE activa = TRUE
ORDER BY categoria, nombre;

-- ============================================================
-- CONSULTAS DE VERIFICACION
-- ============================================================
-- SELECT * FROM app.v_ubicaciones_activas;
-- SELECT r.codigo, rp.orden, rp.latitud, rp.longitud, rp.etiqueta
-- FROM app.rutas r
-- JOIN app.ruta_puntos rp ON rp.ruta_id = r.id
-- ORDER BY r.codigo, rp.orden;
