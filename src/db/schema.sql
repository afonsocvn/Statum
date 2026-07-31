-- Schema inicial do Statum.
-- Ainda nao contem tabelas de jogo (utilizadores, paises, etc.) --
-- essas serao adicionadas passo a passo, apos decisoes confirmadas com o dono do projeto.

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('schema_version', '0');
