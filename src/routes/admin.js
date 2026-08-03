const express = require('express');
const db = require('../db');

const router = express.Router();

const ROUND_DURATION_MS = 2 * 60 * 60 * 1000; // 2h

function requireAdmin(req, res, next) {
  if (!res.locals.currentUser || !res.locals.currentUser.isAdmin) {
    return res.status(403).send('Admin only.');
  }
  next();
}

function listWars() {
  return db
    .prepare(
      `SELECT wars.*, a.name AS attackerName, d.name AS defenderName
       FROM wars
       JOIN countries a ON a.id = wars.attacker_country_id
       JOIN countries d ON d.id = wars.defender_country_id
       ORDER BY wars.declared_at DESC`
    )
    .all();
}

router.get('/admin/wars', requireAdmin, (req, res) => {
  const countries = db.prepare('SELECT id, name FROM countries ORDER BY name').all();
  res.render('admin-wars', { wars: listWars(), countries, error: null });
});

router.post('/admin/wars', requireAdmin, (req, res) => {
  const attackerId = parseInt(req.body.attacker_country_id, 10);
  const defenderId = parseInt(req.body.defender_country_id, 10);

  if (!attackerId || !defenderId || attackerId === defenderId) {
    const countries = db.prepare('SELECT id, name FROM countries ORDER BY name').all();
    return res.render('admin-wars', { wars: listWars(), countries, error: 'Pick two different countries.' });
  }

  db.prepare(
    'INSERT INTO wars (attacker_country_id, defender_country_id) VALUES (?, ?)'
  ).run(attackerId, defenderId);

  res.redirect('/admin/wars');
});

router.get('/admin/wars/:id/battles/new', requireAdmin, (req, res, next) => {
  const war = db
    .prepare(
      `SELECT wars.*, a.name AS attackerName, d.name AS defenderName
       FROM wars
       JOIN countries a ON a.id = wars.attacker_country_id
       JOIN countries d ON d.id = wars.defender_country_id
       WHERE wars.id = ?`
    )
    .get(req.params.id);
  if (!war) return next();

  const regions = db
    .prepare('SELECT id, name, terrain FROM regions WHERE country_id = ? ORDER BY name')
    .all(war.defender_country_id);

  res.render('admin-battle-new', { war, regions, error: null });
});

router.post('/admin/wars/:id/battles', requireAdmin, (req, res, next) => {
  const war = db.prepare('SELECT * FROM wars WHERE id = ?').get(req.params.id);
  if (!war) return next();

  const region = db
    .prepare('SELECT id FROM regions WHERE id = ? AND country_id = ?')
    .get(req.body.region_id, war.defender_country_id);

  if (!region) {
    const regions = db
      .prepare('SELECT id, name, terrain FROM regions WHERE country_id = ? ORDER BY name')
      .all(war.defender_country_id);
    return res.render('admin-battle-new', { war, regions, error: 'Pick a valid region of the defending country.' });
  }

  const result = db
    .prepare(
      `INSERT INTO battles (war_id, attacker_country_id, defender_country_id, region_id, round_duration_ms)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(war.id, war.attacker_country_id, war.defender_country_id, region.id, ROUND_DURATION_MS);

  res.redirect(`/battles/${result.lastInsertRowid}`);
});

module.exports = router;
