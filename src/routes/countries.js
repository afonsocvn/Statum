const express = require('express');
const db = require('../db');

const router = express.Router();

const CONTINENT_ORDER = ['Europa', 'Ásia', 'Américas'];

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

module.exports = router;
