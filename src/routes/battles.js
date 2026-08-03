const express = require('express');
const db = require('../db');
const { resolveHit, HP_PER_HIT, MAX_HP, FOOD_HP_RESTORE, getRank } = require('../lib/military');

const router = express.Router();

const HIT_BATCH_SIZES = [1, 5, 10];

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

const ERROR_MESSAGES = {
  not_participant: "Your country isn't part of this battle.",
  not_enough_hp: "You don't have enough HP for that many hits.",
  not_enough_weapons: "You don't have enough Weapons in your inventory for that many armed hits.",
  battle_finished: 'This battle has already finished.',
  no_food: "You don't have any Food to eat.",
};

function getBattle(id) {
  return db
    .prepare(
      `SELECT battles.*, a.name AS attackerName, d.name AS defenderName, regions.name AS regionName, regions.terrain
       FROM battles
       JOIN countries a ON a.id = battles.attacker_country_id
       JOIN countries d ON d.id = battles.defender_country_id
       JOIN regions ON regions.id = battles.region_id
       WHERE battles.id = ?`
    )
    .get(id);
}

router.get('/battles', (req, res) => {
  const battles = db
    .prepare(
      `SELECT battles.*, a.name AS attackerName, d.name AS defenderName, regions.name AS regionName
       FROM battles
       JOIN countries a ON a.id = battles.attacker_country_id
       JOIN countries d ON d.id = battles.defender_country_id
       JOIN regions ON regions.id = battles.region_id
       ORDER BY battles.status ASC, battles.created_at DESC`
    )
    .all();
  res.render('battles', { battles });
});

router.get('/battles/:id', (req, res, next) => {
  const battle = getBattle(req.params.id);
  if (!battle) return next();

  const skills = req.session.userId
    ? db.prepare('SELECT * FROM user_skills WHERE user_id = ?').get(req.session.userId)
    : null;

  const weaponStock = req.session.userId
    ? db
        .prepare(
          "SELECT COALESCE(SUM(quantity), 0) AS total FROM user_inventory WHERE user_id = ? AND good_key = 'weapons'"
        )
        .get(req.session.userId).total
    : 0;

  const foodStock = req.session.userId
    ? db
        .prepare(
          "SELECT COALESCE(SUM(quantity), 0) AS total FROM user_inventory WHERE user_id = ? AND good_key = 'food'"
        )
        .get(req.session.userId).total
    : 0;

  let side = null;
  if (res.locals.currentUser) {
    if (res.locals.currentUser.countryId === battle.attacker_country_id) side = 'attacker';
    else if (res.locals.currentUser.countryId === battle.defender_country_id) side = 'defender';
  }

  res.render('battle', {
    battle,
    side,
    skills,
    weaponStock,
    foodStock,
    hitBatchSizes: HIT_BATCH_SIZES,
    rank: res.locals.currentUser ? getRank(res.locals.currentUser.totalDamage) : null,
    error: ERROR_MESSAGES[req.query.error] || null,
    message: req.query.dealt ? `You dealt ${req.query.dealt} damage.` : null,
  });
});

router.post('/battles/:id/hit', requireLogin, (req, res, next) => {
  const battle = getBattle(req.params.id);
  if (!battle) return next();
  if (battle.status !== 'active') return res.redirect(`/battles/${battle.id}?error=battle_finished`);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  let side = null;
  if (user.country_id === battle.attacker_country_id) side = 'attacker';
  else if (user.country_id === battle.defender_country_id) side = 'defender';
  if (!side) return res.redirect(`/battles/${battle.id}?error=not_participant`);

  const hits = HIT_BATCH_SIZES.includes(parseInt(req.body.hits, 10)) ? parseInt(req.body.hits, 10) : 1;
  const useWeapon = req.body.use_weapon === 'yes';

  const hpCost = hits * HP_PER_HIT;
  if (user.hp < hpCost) return res.redirect(`/battles/${battle.id}?error=not_enough_hp`);

  let weaponQualities = [];
  if (useWeapon) {
    const stacks = db
      .prepare(
        "SELECT quality_level, quantity FROM user_inventory WHERE user_id = ? AND good_key = 'weapons' AND quantity > 0 ORDER BY quality_level DESC"
      )
      .all(user.id);
    let remaining = hits;
    for (const stack of stacks) {
      const take = Math.min(remaining, stack.quantity);
      for (let i = 0; i < take; i += 1) weaponQualities.push(stack.quality_level);
      remaining -= take;
      if (remaining === 0) break;
    }
    if (remaining > 0) return res.redirect(`/battles/${battle.id}?error=not_enough_weapons`);
  }

  const skills = db.prepare('SELECT * FROM user_skills WHERE user_id = ?').get(user.id) || {
    naval: 0,
    mountainous: 0,
    terrestrial: 0,
    desert: 0,
  };

  let totalDamage = 0;
  let runningTotalDamage = user.total_damage;
  for (let i = 0; i < hits; i += 1) {
    const { damage } = resolveHit({
      skills,
      terrain: battle.terrain,
      weaponQuality: useWeapon ? weaponQualities[i] : null,
      totalDamage: runningTotalDamage,
    });
    totalDamage += damage;
    runningTotalDamage += damage;
  }

  const damageColumn = side === 'attacker' ? 'attacker_round_damage' : 'defender_round_damage';

  const applyHit = db.transaction(() => {
    db.prepare('UPDATE users SET hp = hp - ?, total_damage = total_damage + ? WHERE id = ?').run(
      hpCost,
      totalDamage,
      user.id
    );

    if (useWeapon) {
      const consumeStack = db.prepare(
        'UPDATE user_inventory SET quantity = quantity - ? WHERE user_id = ? AND good_key = ? AND quality_level = ?'
      );
      const counts = weaponQualities.reduce((acc, q) => {
        acc[q] = (acc[q] || 0) + 1;
        return acc;
      }, {});
      Object.entries(counts).forEach(([quality, count]) => {
        consumeStack.run(count, user.id, 'weapons', quality);
      });
    }

    db.prepare(`UPDATE battles SET ${damageColumn} = ${damageColumn} + ? WHERE id = ?`).run(totalDamage, battle.id);

    db.prepare(
      'INSERT INTO battle_hits (battle_id, round_number, user_id, side, hits, damage) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(battle.id, battle.round_number, user.id, side, hits, totalDamage);
  });
  applyHit();

  res.redirect(`/battles/${battle.id}?dealt=${totalDamage}`);
});

router.post('/battles/:id/eat-food', requireLogin, (req, res, next) => {
  const battle = getBattle(req.params.id);
  if (!battle) return next();

  const foodStack = db
    .prepare(
      "SELECT quality_level, quantity FROM user_inventory WHERE user_id = ? AND good_key = 'food' AND quantity > 0 ORDER BY quality_level DESC LIMIT 1"
    )
    .get(req.session.userId);

  if (!foodStack) return res.redirect(`/battles/${battle.id}?error=no_food`);

  const eat = db.transaction(() => {
    db.prepare(
      'UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND good_key = ? AND quality_level = ?'
    ).run(req.session.userId, 'food', foodStack.quality_level);
    db.prepare('UPDATE users SET hp = MIN(?, hp + ?) WHERE id = ?').run(MAX_HP, FOOD_HP_RESTORE, req.session.userId);
  });
  eat();

  res.redirect(`/battles/${battle.id}`);
});

module.exports = router;
