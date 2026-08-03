-- Schema do Statum.
-- Tabelas de jogo (paises, empresas, etc.) serao adicionadas passo a passo,
-- apos decisoes confirmadas com o dono do projeto.

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('schema_version', '11');

CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  continent TEXT NOT NULL,
  population INTEGER NOT NULL,
  treasury INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  name TEXT NOT NULL,
  is_capital INTEGER NOT NULL DEFAULT 0,
  terrain TEXT NOT NULL DEFAULT 'terrestrial', -- semicolon-separated: naval;mountainous;terrestrial;desert
  UNIQUE (country_id, name)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  region_id INTEGER NOT NULL REFERENCES regions(id),
  gold INTEGER NOT NULL DEFAULT 0,
  national_currency INTEGER NOT NULL DEFAULT 0,
  is_bot INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  hp INTEGER NOT NULL DEFAULT 100,
  total_damage INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  good_key TEXT NOT NULL,
  quality_level INTEGER NOT NULL DEFAULT 1,
  salary INTEGER NOT NULL,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  region_id INTEGER NOT NULL REFERENCES regions(id),
  inventory INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  worker_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  last_worked_at TEXT
);

CREATE TABLE IF NOT EXISTS user_inventory (
  user_id INTEGER NOT NULL REFERENCES users(id),
  good_key TEXT NOT NULL,
  quality_level INTEGER NOT NULL DEFAULT 1,
  quantity INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, good_key, quality_level)
);

CREATE TABLE IF NOT EXISTS user_skills (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  naval INTEGER NOT NULL DEFAULT 0,
  mountainous INTEGER NOT NULL DEFAULT 0,
  terrestrial INTEGER NOT NULL DEFAULT 0,
  desert INTEGER NOT NULL DEFAULT 0,
  unspent_points INTEGER NOT NULL DEFAULT 0,
  last_trained_at TEXT
);

CREATE TABLE IF NOT EXISTS market_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES users(id),
  country_id INTEGER NOT NULL REFERENCES countries(id),
  item_type TEXT NOT NULL, -- 'good' or 'gold'
  good_key TEXT,
  quality_level INTEGER NOT NULL DEFAULT 1,
  source_company_id INTEGER REFERENCES companies(id),
  quantity INTEGER NOT NULL,
  price_per_unit INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attacker_country_id INTEGER NOT NULL REFERENCES countries(id),
  defender_country_id INTEGER NOT NULL REFERENCES countries(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, ended
  declared_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS battles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  war_id INTEGER REFERENCES wars(id),
  attacker_country_id INTEGER NOT NULL REFERENCES countries(id),
  defender_country_id INTEGER NOT NULL REFERENCES countries(id),
  region_id INTEGER NOT NULL REFERENCES regions(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, finished
  phase TEXT NOT NULL DEFAULT 'regular', -- regular (8 rounds of round_duration_ms), overtime (3 rounds of 1h if tied)
  round_number INTEGER NOT NULL DEFAULT 1,
  round_duration_ms INTEGER NOT NULL DEFAULT 7200000,
  round_started_at TEXT NOT NULL DEFAULT (datetime('now')),
  attacker_rounds_won INTEGER NOT NULL DEFAULT 0,
  defender_rounds_won INTEGER NOT NULL DEFAULT 0,
  overtime_attacker_wins INTEGER NOT NULL DEFAULT 0,
  overtime_defender_wins INTEGER NOT NULL DEFAULT 0,
  attacker_round_damage INTEGER NOT NULL DEFAULT 0,
  defender_round_damage INTEGER NOT NULL DEFAULT 0,
  winner_country_id INTEGER REFERENCES countries(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS battle_hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  battle_id INTEGER NOT NULL REFERENCES battles(id),
  round_number INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  side TEXT NOT NULL, -- 'attacker' or 'defender'
  hits INTEGER NOT NULL,
  damage INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
