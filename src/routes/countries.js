const express = require('express');
const db = require('../db');
const { nationalCurrencyName } = require('../lib/currency');

const router = express.Router();

const CONTINENT_ORDER = ['Europe', 'Asia', 'Americas'];

function flagEmoji(code) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

router.get('/countries', (req, res) => {
  const rows = db
    .prepare('SELECT name, code, continent, population FROM countries ORDER BY continent, population DESC')
    .all()
    .map((row) => ({ ...row, flag: flagEmoji(row.code) }));

  const byContinent = CONTINENT_ORDER.map((continent) => ({
    continent,
    countries: rows.filter((row) => row.continent === continent),
  }));

  res.render('countries', { byContinent });
});

router.get('/countries/:code', (req, res, next) => {
  const country = db
    .prepare('SELECT id, name, code, continent, population, treasury FROM countries WHERE code = ?')
    .get(req.params.code.toUpperCase());

  if (!country) return next();

  const regions = db
    .prepare('SELECT name, is_capital FROM regions WHERE country_id = ? ORDER BY is_capital DESC, name')
    .all(country.id);

  res.render('country', {
    country: { ...country, flag: flagEmoji(country.code), currencyName: nationalCurrencyName(country.name) },
    regions,
  });
});

module.exports = router;
