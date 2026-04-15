-- ============================================================
-- SCRIPT POSTGRESQL PARA USUARIOS (PGADMIN)
-- Proyecto: Leaflet-Mapas-Interactivos
-- Objetivo: crear rol de BD y tabla de usuarios de aplicacion
-- Fecha: 2026-04-11
-- ============================================================

/*
  EJECUCION RECOMENDADA
  ---------------------
  1) Conectate a la BD administrativa "postgres" y ejecuta el PASO A.
  2) Conectate a "leaflet_maps_db" y ejecuta el PASO B.

  NOTA:
  - Cambia las contrasenas iniciales antes de pasar a produccion.
*/

-- ============================================================
-- PASO A: ROL TECNICO DE POSTGRES (ejecutar en BD administrativa)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'leaflet_app') THEN
    CREATE ROLE leaflet_app LOGIN PASSWORD 'Cambiar_123!';
  END IF;
END
$$;

ALTER ROLE leaflet_app SET search_path = app, public;

-- Ajusta la contrasena tecnica si ya existe el rol
ALTER ROLE leaflet_app WITH PASSWORD 'Cambiar_123!';

-- Permisos sobre la base (ajusta el nombre si usas otra)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_database WHERE datname = 'leaflet_maps_db') THEN
    EXECUTE 'GRANT CONNECT ON DATABASE leaflet_maps_db TO leaflet_app';
  ELSE
    RAISE NOTICE 'La base leaflet_maps_db no existe aun. Crea la BD y luego vuelve a ejecutar este script.';
  END IF;
END
$$;

-- ============================================================
-- PASO B: USUARIOS DE APLICACION (ejecutar en leaflet_maps_db)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS app;

-- Necesario para hash de password con crypt/bf
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app.usuarios (
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

COMMENT ON TABLE app.usuarios IS 'Usuarios de aplicacion para autenticacion y autorizacion';

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON app.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON app.usuarios(rol);

-- Permisos para el rol tecnico sobre schema y tablas
GRANT USAGE ON SCHEMA app TO leaflet_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO leaflet_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO leaflet_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO leaflet_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT USAGE, SELECT ON SEQUENCES TO leaflet_app;

-- Usuario inicial de aplicacion (admin)
-- Password inicial: Admin123!  (cambiar al primer login)
DO $$
DECLARE
  v_user_id BIGINT;
BEGIN
  SELECT id INTO v_user_id
  FROM app.usuarios
  WHERE username = 'admin' OR email = 'admin@leaflet.local'
  ORDER BY id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    INSERT INTO app.usuarios (username, email, password_hash, nombre_completo, rol)
    VALUES (
      'admin',
      'admin@leaflet.local',
      crypt('Admin123!', gen_salt('bf', 10)),
      'Administrador Inicial',
      'admin'
    );
  ELSE
    UPDATE app.usuarios
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

-- Si quieres forzar reset de password del admin, descomenta:
-- UPDATE app.usuarios
-- SET password_hash = crypt('Admin123!', gen_salt('bf', 10)),
--     updated_at = NOW()
-- WHERE username = 'admin';

-- Ejemplo de validacion de login (ajusta valores)
-- SELECT id, username, rol
-- FROM app.usuarios
-- WHERE username = 'admin'
--   AND password_hash = crypt('Admin123!', password_hash)
--   AND activo = TRUE;

-- Verificacion de usuario tecnico (ejecutar en BD postgres):
-- SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname = 'leaflet_app';
