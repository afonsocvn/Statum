const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');
const countries = require('./countries-data');
const regionTerrain = require('./region-terrain-data');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'statum.sqlite');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

const insertCountry = db.prepare(
  'INSERT OR IGNORE INTO countries (name, code, continent, population) VALUES (@name, @code, @continent, @population)'
);
const seedCountries = db.transaction((rows) => {
  for (const row of rows) insertCountry.run(row);
});
seedCountries(countries);

const REGION_NAMES = [
  'Capital',
  'North Region',
  'South Region',
  'East Region',
  'West Region',
  'Central Region',
];

// Regions are seeded only once, ever. Re-running this after regions have been
// renamed/reassigned by war conquest would "heal" conquered regions back to
// their original owner, since the seeder would no longer find a row matching
// the original (country_id, name) pair and would insert a fresh one instead.
const regionsAlreadySeeded = db.prepare("SELECT value FROM schema_meta WHERE key = 'regions_seeded'").get();

if (!regionsAlreadySeeded) {
  const insertRegion = db.prepare(
    'INSERT OR IGNORE INTO regions (country_id, name, is_capital, terrain) VALUES (@country_id, @name, @is_capital, @terrain)'
  );
  const seedRegions = db.transaction(() => {
    const countryRows = db.prepare('SELECT id, name FROM countries').all();
    for (const country of countryRows) {
      REGION_NAMES.forEach((name, index) => {
        const terrain = (regionTerrain[country.name] && regionTerrain[country.name][name]) || 'terrestrial';
        insertRegion.run({ country_id: country.id, name, is_capital: index === 0 ? 1 : 0, terrain });
      });
    }
    db.prepare("INSERT INTO schema_meta (key, value) VALUES ('regions_seeded', '1')").run();
  });
  seedRegions();
}

const { seedBots } = require('../lib/bots');
seedBots(db);

if (process.env.ADMIN_USERNAME) {
  db.prepare('UPDATE users SET is_admin = 1 WHERE username = ?').run(process.env.ADMIN_USERNAME);
}

module.exports = db;
