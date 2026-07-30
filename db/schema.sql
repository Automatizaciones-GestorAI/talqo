CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idioma_nativo TEXT NOT NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS perfiles_idioma (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  idioma_objetivo     TEXT NOT NULL,
  variante_acento     TEXT,
  nivel_speaking      TEXT NOT NULL DEFAULT 'A1',
  nivel_listening     TEXT NOT NULL DEFAULT 'A1',
  nivel_gramatica     TEXT NOT NULL DEFAULT 'A1',
  nivel_vocabulario   TEXT NOT NULL DEFAULT 'A1',
  objetivo_sesion_actual TEXT,
  actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, idioma_objetivo)
);

CREATE TABLE IF NOT EXISTS errores_recurrentes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id   UUID NOT NULL REFERENCES perfiles_idioma(id) ON DELETE CASCADE,
  tipo_error  TEXT NOT NULL,
  frecuencia  INTEGER NOT NULL DEFAULT 1,
  ultima_vez  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (perfil_id, tipo_error)
);

CREATE TABLE IF NOT EXISTS vocabulario_visto (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id   UUID NOT NULL REFERENCES perfiles_idioma(id) ON DELETE CASCADE,
  palabra     TEXT NOT NULL,
  ipa         TEXT,
  traduccion  TEXT,
  visto_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (perfil_id, palabra)
);

CREATE TABLE IF NOT EXISTS sesiones (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id        UUID NOT NULL REFERENCES perfiles_idioma(id) ON DELETE CASCADE,
  objetivo_sesion  TEXT,
  resumen          TEXT,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perfiles_usuario ON perfiles_idioma(usuario_id);
CREATE INDEX IF NOT EXISTS idx_errores_perfil ON errores_recurrentes(perfil_id);
CREATE INDEX IF NOT EXISTS idx_vocab_perfil ON vocabulario_visto(perfil_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_perfil ON sesiones(perfil_id);
