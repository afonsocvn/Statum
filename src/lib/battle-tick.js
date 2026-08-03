const { XP_ROUND_MEDAL, XP_BATTLE_HERO_MEDAL, awardXp } = require('./xp');

const OVERTIME_ROUND_DURATION_MS = 60 * 60 * 1000; // 1h
const REGULAR_ROUNDS = 8;
const REGULAR_ROUNDS_TO_WIN = 5;
const OVERTIME_ROUNDS = 3;
const OVERTIME_ROUNDS_TO_WIN = 2;
const ROUND_MEDAL_GOLD = 5;
const BATTLE_HERO_MEDAL_GOLD = 25;

function awardRoundMedals(db, battle) {
  ['attacker', 'defender'].forEach((side) => {
    const top = db
      .prepare(
        `SELECT user_id, SUM(damage) AS total FROM battle_hits
         WHERE battle_id = ? AND round_number = ? AND side = ?
         GROUP BY user_id ORDER BY total DESC LIMIT 1`
      )
      .get(battle.id, battle.round_number, side);
    if (!top || top.total <= 0) return;

    const medalType = side === 'attacker' ? 'attacker_round_mvp' : 'defender_round_mvp';
    db.prepare(
      'INSERT INTO medals (user_id, battle_id, medal_type, round_number, gold_awarded, xp_awarded) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(top.user_id, battle.id, medalType, battle.round_number, ROUND_MEDAL_GOLD, XP_ROUND_MEDAL);
    db.prepare('UPDATE users SET gold = gold + ? WHERE id = ?').run(ROUND_MEDAL_GOLD, top.user_id);
    awardXp(top.user_id, XP_ROUND_MEDAL);
  });
}

function awardBattleHeroMedal(db, battle, winnerSide) {
  const top = db
    .prepare(
      `SELECT user_id, SUM(damage) AS total FROM battle_hits
       WHERE battle_id = ? AND side = ?
       GROUP BY user_id ORDER BY total DESC LIMIT 1`
    )
    .get(battle.id, winnerSide);
  if (!top || top.total <= 0) return;

  const medalType = winnerSide === 'attacker' ? 'attacker_battle_hero' : 'defender_battle_hero';
  db.prepare(
    'INSERT INTO medals (user_id, battle_id, medal_type, round_number, gold_awarded, xp_awarded) VALUES (?, ?, ?, NULL, ?, ?)'
  ).run(top.user_id, battle.id, medalType, BATTLE_HERO_MEDAL_GOLD, XP_BATTLE_HERO_MEDAL);
  db.prepare('UPDATE users SET gold = gold + ? WHERE id = ?').run(BATTLE_HERO_MEDAL_GOLD, top.user_id);
  awardXp(top.user_id, XP_BATTLE_HERO_MEDAL);
}

function conquerRegion(db, battle) {
  const region = db.prepare('SELECT * FROM regions WHERE id = ?').get(battle.region_id);
  const defenderCountry = db.prepare('SELECT * FROM countries WHERE id = ?').get(battle.defender_country_id);
  const newName = `${region.name} (${defenderCountry.name})`;

  db.prepare('UPDATE regions SET country_id = ?, name = ? WHERE id = ?').run(
    battle.winner_country_id,
    newName,
    region.id
  );
  db.prepare('UPDATE companies SET country_id = ? WHERE region_id = ?').run(battle.winner_country_id, region.id);
}

function finishBattle(db, battle, winnerSide) {
  const winnerCountryId = winnerSide === 'attacker' ? battle.attacker_country_id : battle.defender_country_id;

  db.prepare(
    "UPDATE battles SET status = 'finished', winner_country_id = ? WHERE id = ?"
  ).run(winnerCountryId, battle.id);

  if (winnerSide === 'attacker') {
    const finished = { ...battle, winner_country_id: winnerCountryId };
    conquerRegion(db, finished);
  }

  awardBattleHeroMedal(db, battle, winnerSide);
}

function tallyRegularRound(db, battle) {
  awardRoundMedals(db, battle);

  let attackerWins = battle.attacker_rounds_won;
  let defenderWins = battle.defender_rounds_won;

  if (battle.attacker_round_damage > battle.defender_round_damage) attackerWins += 1;
  else if (battle.defender_round_damage > battle.attacker_round_damage) defenderWins += 1;

  // Persist the round result immediately so attacker_rounds_won/defender_rounds_won
  // are correct even when this round decides the battle.
  db.prepare('UPDATE battles SET attacker_rounds_won = ?, defender_rounds_won = ? WHERE id = ?').run(
    attackerWins,
    defenderWins,
    battle.id
  );

  if (attackerWins >= REGULAR_ROUNDS_TO_WIN) {
    finishBattle(db, battle, 'attacker');
    return;
  }
  if (defenderWins >= REGULAR_ROUNDS_TO_WIN) {
    finishBattle(db, battle, 'defender');
    return;
  }

  if (battle.round_number >= REGULAR_ROUNDS) {
    db.prepare(
      `UPDATE battles
       SET phase = 'overtime', round_number = 1, round_duration_ms = ?, round_started_at = datetime('now'),
           attacker_rounds_won = ?, defender_rounds_won = ?, attacker_round_damage = 0, defender_round_damage = 0
       WHERE id = ?`
    ).run(OVERTIME_ROUND_DURATION_MS, attackerWins, defenderWins, battle.id);
    return;
  }

  db.prepare(
    `UPDATE battles
     SET round_number = round_number + 1, round_started_at = datetime('now'),
         attacker_rounds_won = ?, defender_rounds_won = ?, attacker_round_damage = 0, defender_round_damage = 0
     WHERE id = ?`
  ).run(attackerWins, defenderWins, battle.id);
}

function tallyOvertimeRound(db, battle) {
  awardRoundMedals(db, battle);

  let attackerWins = battle.overtime_attacker_wins;
  let defenderWins = battle.overtime_defender_wins;

  if (battle.attacker_round_damage > battle.defender_round_damage) attackerWins += 1;
  else if (battle.defender_round_damage > battle.attacker_round_damage) defenderWins += 1;

  db.prepare('UPDATE battles SET overtime_attacker_wins = ?, overtime_defender_wins = ? WHERE id = ?').run(
    attackerWins,
    defenderWins,
    battle.id
  );

  if (attackerWins >= OVERTIME_ROUNDS_TO_WIN) {
    finishBattle(db, battle, 'attacker');
    return;
  }
  if (defenderWins >= OVERTIME_ROUNDS_TO_WIN) {
    finishBattle(db, battle, 'defender');
    return;
  }

  if (battle.round_number >= OVERTIME_ROUNDS) {
    // Still tied after the overtime series (rare) — restart another 3-round overtime series.
    db.prepare(
      `UPDATE battles
       SET round_number = 1, round_started_at = datetime('now'),
           overtime_attacker_wins = 0, overtime_defender_wins = 0, attacker_round_damage = 0, defender_round_damage = 0
       WHERE id = ?`
    ).run(battle.id);
    return;
  }

  db.prepare(
    `UPDATE battles
     SET round_number = round_number + 1, round_started_at = datetime('now'),
         overtime_attacker_wins = ?, overtime_defender_wins = ?, attacker_round_damage = 0, defender_round_damage = 0
     WHERE id = ?`
  ).run(attackerWins, defenderWins, battle.id);
}

function runBattleTick(db) {
  const activeBattles = db.prepare("SELECT * FROM battles WHERE status = 'active'").all();

  activeBattles.forEach((battle) => {
    const elapsed = Date.now() - new Date(battle.round_started_at.replace(' ', 'T') + 'Z').getTime();
    if (elapsed < battle.round_duration_ms) return;

    if (battle.phase === 'regular') {
      tallyRegularRound(db, battle);
    } else {
      tallyOvertimeRound(db, battle);
    }
  });
}

module.exports = { runBattleTick };
