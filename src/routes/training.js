const express = require('express');
const db = require('../db');

const router = express.Router();

const TRAIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const POINTS_PER_TRAINING = 5;
const SKILLS = ['naval', 'mountainous', 'terrestrial', 'desert'];

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function getOrCreateSkills(userId) {
  db.prepare('INSERT OR IGNORE INTO user_skills (user_id) VALUES (?)').run(userId);
  return db.prepare('SELECT * FROM user_skills WHERE user_id = ?').get(userId);
}

const ERROR_MESSAGES = {
  cooldown: 'You already trained in the last 24 hours.',
  invalid_allocation: "That allocation doesn't add up — check your unspent points.",
};

router.get('/training', requireLogin, (req, res) => {
  const skills = getOrCreateSkills(req.session.userId);
  res.render('training', { skills, error: ERROR_MESSAGES[req.query.error] || null });
});

router.post('/training/train', requireLogin, (req, res) => {
  const skills = getOrCreateSkills(req.session.userId);

  if (skills.last_trained_at) {
    const elapsed = Date.now() - new Date(skills.last_trained_at.replace(' ', 'T') + 'Z').getTime();
    if (elapsed < TRAIN_COOLDOWN_MS) return res.redirect('/training?error=cooldown');
  }

  db.prepare(
    "UPDATE user_skills SET unspent_points = unspent_points + ?, last_trained_at = datetime('now') WHERE user_id = ?"
  ).run(POINTS_PER_TRAINING, req.session.userId);

  res.redirect('/training');
});

router.post('/training/allocate', requireLogin, (req, res) => {
  const skills = getOrCreateSkills(req.session.userId);

  const allocations = {};
  let total = 0;
  for (const skill of SKILLS) {
    const value = parseInt(req.body[skill], 10) || 0;
    if (value < 0) return res.redirect('/training?error=invalid_allocation');
    allocations[skill] = value;
    total += value;
  }

  if (total <= 0 || total > skills.unspent_points) {
    return res.redirect('/training?error=invalid_allocation');
  }

  db.prepare(
    `UPDATE user_skills
     SET naval = naval + ?, mountainous = mountainous + ?, terrestrial = terrestrial + ?, desert = desert + ?,
         unspent_points = unspent_points - ?
     WHERE user_id = ?`
  ).run(allocations.naval, allocations.mountainous, allocations.terrestrial, allocations.desert, total, req.session.userId);

  res.redirect('/training');
});

module.exports = router;
