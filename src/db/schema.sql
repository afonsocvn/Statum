-- Schema do Statum.
-- Tabelas de jogo (paises, empresas, etc.) serao adicionadas passo a passo,
-- apos decisoes confirmadas com o dono do projeto.

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('schema_version', '4');

CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  continent TEXT NOT NULL,
  population INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  name TEXT NOT NULL,
  is_capital INTEGER NOT NULL DEFAULT 0,
  UNIQUE (country_id, name)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  region_id INTEGER NOT NULL REFERENCES regions(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
