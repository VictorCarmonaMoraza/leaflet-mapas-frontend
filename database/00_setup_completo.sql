-- ============================================================
-- SETUP COMPLETO POSTGRESQL (PGADMIN)
-- Proyecto: Leaflet-Mapas-Interactivos
-- Objetivo: crear BD, rol tecnico, tablas y datos iniciales
-- Fecha: 2026-04-11
-- ============================================================

/*
  IMPORTANTE SOBRE PGADMIN
  ------------------------
  Un mismo fichero SI, pero con 2 ejecuciones en distinto contexto:

  1) Conectado a la BD administrativa "postgres":
     - Ejecuta SOLO el BLOQUE A.

  2) Conectado a la BD "leaflet_maps_db":
     - Ejecuta SOLO el BLOQUE B.

  Nota: pgAdmin no cambia automaticamente de BD dentro del mismo query.
*/


-- ============================================================
-- BLOQUE A (EJECUTAR EN BD: postgres)
-- ============================================================

-- 1) Crear base de datos (si ya existe, omite esta linea)
-- CREATE DATABASE leaflet_maps_db;

-- 2) Crear/ajustar rol tecnico
DO $$
BEGIN
  IF current_database() <> 'postgres' THEN
    RAISE NOTICE 'BLOQUE A omitido: conecta a la BD postgres para ejecutar este bloque.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'leaflet_app') THEN
    CREATE ROLE leaflet_app LOGIN PASSWORD 'Cambiar_123!';
  END IF;
END
$$;

DO $$
BEGIN
  IF current_database() <> 'postgres' THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'leaflet_app') THEN
    EXECUTE 'ALTER ROLE leaflet_app SET search_path = public';
    EXECUTE 'ALTER ROLE leaflet_app WITH PASSWORD ''Cambiar_123!''';
  END IF;
END
$$;

-- 3) Otorgar permiso de conexion a la BD objetivo
DO $$
BEGIN
  IF current_database() <> 'postgres' THEN
    RAISE NOTICE 'BLOQUE A omitido: conecta a la BD postgres para ejecutar este bloque.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_database WHERE datname = 'leaflet_maps_db') THEN
    EXECUTE 'GRANT CONNECT ON DATABASE leaflet_maps_db TO leaflet_app';
  ELSE
    RAISE NOTICE 'La base leaflet_maps_db no existe aun. Crea la BD y repite BLOQUE A.';
  END IF;
END
$$;


-- ============================================================
-- BLOQUE B (EJECUTAR EN BD: leaflet_maps_db)
-- ============================================================

DO $$
BEGIN
  IF current_database() <> 'leaflet_maps_db' THEN
    RAISE NOTICE 'BLOQUE B omitido: conecta a la BD leaflet_maps_db para ejecutar este bloque.';
    RETURN;
  END IF;
END
$$;

-- Extension para hash de passwords
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Limpiar vistas de compatibilidad antiguas solo si realmente son vistas
DO $$
DECLARE
  _name TEXT;
BEGIN
  FOREACH _name IN ARRAY ARRAY['ruta_puntos', 'rutas', 'ubicaciones', 'usuarios']
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = _name
        AND c.relkind IN ('v', 'm')
    ) THEN
      EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', _name);
    END IF;
  END LOOP;
END
$$;

-- ------------------------------------------------------------
-- TABLA: ubicaciones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ubicaciones (
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

CREATE INDEX IF NOT EXISTS idx_ubicaciones_categoria ON public.ubicaciones (categoria);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_nombre ON public.ubicaciones (nombre);

-- ------------------------------------------------------------
-- TABLA: rutas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rutas (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  descripcion VARCHAR(255),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLA: ruta_puntos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ruta_puntos (
  id BIGSERIAL PRIMARY KEY,
  ruta_id BIGINT NOT NULL REFERENCES public.rutas(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  latitud NUMERIC(9,6) NOT NULL,
  longitud NUMERIC(9,6) NOT NULL,
  etiqueta VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ruta_puntos_orden UNIQUE (ruta_id, orden),
  CONSTRAINT ck_ruta_puntos_latitud CHECK (latitud BETWEEN -90 AND 90),
  CONSTRAINT ck_ruta_puntos_longitud CHECK (longitud BETWEEN -180 AND 180)
);

CREATE INDEX IF NOT EXISTS idx_ruta_puntos_ruta_id ON public.ruta_puntos (ruta_id);

-- ------------------------------------------------------------
-- TABLA: usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usuarios (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre_completo VARCHAR(150),
  rol VARCHAR(30) NOT NULL DEFAULT 'user',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_usuarios_rol CHECK (rol IN ('admin', 'user', 'viewer'))
);

COMMENT ON TABLE public.usuarios IS 'Usuarios de aplicacion para autenticacion y autorizacion';

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);

-- ------------------------------------------------------------
-- TABLA: notas_mapa
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notas_mapa (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50),
  ciudad_nombre VARCHAR(120) NOT NULL,
  latitud NUMERIC(9,6) NOT NULL,
  longitud NUMERIC(9,6) NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_notas_mapa_latitud CHECK (latitud BETWEEN -90 AND 90),
  CONSTRAINT ck_notas_mapa_longitud CHECK (longitud BETWEEN -180 AND 180),
  CONSTRAINT ck_notas_mapa_comentario CHECK (length(trim(comentario)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_notas_mapa_username ON public.notas_mapa(username);
CREATE INDEX IF NOT EXISTS idx_notas_mapa_created_at ON public.notas_mapa(created_at DESC);

-- ------------------------------------------------------------
-- PERMISOS A ROL TECNICO
-- ------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO leaflet_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO leaflet_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO leaflet_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO leaflet_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO leaflet_app;

-- ------------------------------------------------------------
-- DATOS SEMILLA: ubicaciones
-- ------------------------------------------------------------
INSERT INTO public.ubicaciones (codigo, nombre, latitud, longitud, zoom, categoria, descripcion)
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

-- ------------------------------------------------------------
-- DATOS SEMILLA: ruta de ejemplo
-- ------------------------------------------------------------
INSERT INTO public.rutas (codigo, nombre, descripcion)
VALUES ('RUTA_MADRID_BARCELONA', 'Ruta Madrid - Barcelona', 'Ruta de ejemplo del componente advanced-map')
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    updated_at = NOW();

DELETE FROM public.ruta_puntos
WHERE ruta_id = (SELECT id FROM public.rutas WHERE codigo = 'RUTA_MADRID_BARCELONA');

INSERT INTO public.ruta_puntos (ruta_id, orden, latitud, longitud, etiqueta)
SELECT r.id, v.orden, v.latitud, v.longitud, v.etiqueta
FROM public.rutas r
JOIN (
  VALUES
    (1, 40.4168::NUMERIC(9,6), -3.7038::NUMERIC(9,6), 'Madrid'),
    (2, 41.0082::NUMERIC(9,6), -3.6352::NUMERIC(9,6), 'Centro'),
    (3, 41.3851::NUMERIC(9,6), 2.1734::NUMERIC(9,6), 'Barcelona')
) AS v(orden, latitud, longitud, etiqueta)
ON TRUE
WHERE r.codigo = 'RUTA_MADRID_BARCELONA';

-- ------------------------------------------------------------
-- DATOS SEMILLA: usuario admin de aplicacion
-- ------------------------------------------------------------
DO $$
DECLARE
  v_user_id BIGINT;
BEGIN
  SELECT id INTO v_user_id
  FROM public.usuarios
  WHERE username = 'admin' OR email = 'admin@leaflet.local'
  ORDER BY id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    INSERT INTO public.usuarios (username, email, password_hash, nombre_completo, rol)
    VALUES (
      'admin',
      'admin@leaflet.local',
      crypt('Admin123!', gen_salt('bf', 10)),
      'Administrador Inicial',
      'admin'
    );
  ELSE
    UPDATE public.usuarios
    SET
      username = 'admin',
      email = 'admin@leaflet.local',
      nombre_completo = 'Administrador Inicial',
      rol = 'admin',
      activo = TRUE,
      updated_at = NOW()
    WHERE id = v_user_id;
  END IF;
END
$$;

-- ------------------------------------------------------------
-- VISTA UTIL
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_ubicaciones_activas AS
SELECT
  id,
  codigo,
  nombre,
  latitud,
  longitud,
  zoom,
  categoria,
  descripcion
FROM public.ubicaciones
WHERE activa = TRUE
ORDER BY categoria, nombre;

-- ------------------------------------------------------------
-- CONSULTAS DE VERIFICACION
-- ------------------------------------------------------------
-- SELECT current_database();
-- SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname = 'leaflet_app';
-- SELECT * FROM public.v_ubicaciones_activas;
-- SELECT id, username, email, rol, activo FROM public.usuarios;
-- SELECT id, username, rol FROM public.usuarios
-- WHERE username = 'admin'
--   AND password_hash = crypt('Admin123!', password_hash)
--   AND activo = TRUE;
