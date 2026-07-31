const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');
const countries = require('./countries-data');

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

module.exports = db;
