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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notas_mapa TO leaflet_app;
GRANT USAGE, SELECT ON SEQUENCE public.notas_mapa_id_seq TO leaflet_app;