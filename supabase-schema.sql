-- ============================================================
-- SCHEMA DE BASE DE DATOS PARA INSENIA VOTING
-- Ejecuta este SQL en tu proyecto de Supabase:
--   Supabase Dashboard → SQL Editor → New query → pega esto → Run
-- ============================================================

-- Tabla de votos
CREATE TABLE IF NOT EXISTS votes (
  id          BIGSERIAL PRIMARY KEY,
  video_id    TEXT        NOT NULL,
  fingerprint TEXT        NOT NULL,
  vote_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para verificar rápidamente si ya votó hoy
CREATE UNIQUE INDEX IF NOT EXISTS votes_fingerprint_date_idx
  ON votes (fingerprint, vote_date);

-- Índice para contar votos por vídeo rápidamente
CREATE INDEX IF NOT EXISTS votes_video_id_idx
  ON votes (video_id);

-- Row Level Security (no permitir acceso directo al cliente)
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Solo el service_role puede leer/escribir (nuestras API routes usan service role)
CREATE POLICY "Service role only" ON votes
  USING (false)
  WITH CHECK (false);
