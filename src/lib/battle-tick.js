const OVERTIME_ROUND_DURATION_MS = 60 * 60 * 1000; // 1h
const REGULAR_ROUNDS = 8;
const REGULAR_ROUNDS_TO_WIN = 5;
const OVERTIME_ROUNDS = 3;
const OVERTIME_ROUNDS_TO_WIN = 2;

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
}

function tallyRegularRound(db, battle) {
  let attackerWins = battle.attacker_rounds_won;
  let defenderWins = battle.defender_rounds_won;

  if (battle.attacker_round_damage > battle.defender_round_damage) attackerWins += 1;
  else if (battle.defender_round_damage > battle.attacker_round_damage) defenderWins += 1;

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
  let attackerWins = battle.overtime_attacker_wins;
  let defenderWins = battle.overtime_defender_wins;

  if (battle.attacker_round_damage > battle.defender_round_damage) attackerWins += 1;
  else if (battle.defender_round_damage > battle.attacker_round_damage) defenderWins += 1;

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
