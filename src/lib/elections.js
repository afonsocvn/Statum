// Election cycles are tied to real calendar dates:
// - President: candidacy on the last 3 days of the month, election on the
//   last day, term starts on the 1st of the next month.
// - Congress: same shape, offset to mid-month — candidacy days 12-14,
//   election on day 15, term starts day 16.
// Congress seat count = max(5, number of regions the country currently
// owns) — a country reduced to zero territory by conquest still keeps a
// 5-seat "government in exile".
// Tie-breaks use total_damage as a stand-in for "experience" (no separate
// XP stat exists yet).

const CONGRESS_ELECTION_DAY = 15;
const MIN_CONGRESS_SEATS = 5;
const CANDIDACY_FEE_GOLD = 20;

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatDate(year, monthIndex, day) {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function presidentCycle(now) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = daysInMonth(year, month);
  const day = now.getDate();

  const candidacyOpen = day >= lastDay - 2 && day <= lastDay;
  const isElectionDay = day === lastDay;

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const termStart = formatDate(nextYear, nextMonth, 1);

  return { candidacyOpen, isElectionDay, termStart };
}

function congressCycle(now) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const candidacyOpen = day >= CONGRESS_ELECTION_DAY - 3 && day < CONGRESS_ELECTION_DAY;
  const isElectionDay = day === CONGRESS_ELECTION_DAY;
  const termStart = formatDate(year, month, CONGRESS_ELECTION_DAY + 1);

  return { candidacyOpen, isElectionDay, termStart };
}

function congressSeatCount(db, countryId) {
  const row = db.prepare('SELECT COUNT(*) AS c FROM regions WHERE country_id = ?').get(countryId);
  return Math.max(MIN_CONGRESS_SEATS, row.c);
}

function tallyOffice(db, countryId, office, termStart, seatCount) {
  const alreadyInstalled = db
    .prepare('SELECT id FROM offices WHERE country_id = ? AND role = ? AND term_start = ?')
    .get(countryId, office === 'president' ? 'president' : 'congress_member', termStart);
  if (alreadyInstalled) return;

  const candidates = db
    .prepare(
      `SELECT candidacies.id AS candidacy_id, candidacies.user_id, users.total_damage
       FROM candidacies
       JOIN users ON users.id = candidacies.user_id
       WHERE candidacies.country_id = ? AND candidacies.office = ? AND candidacies.term_start = ?`
    )
    .all(countryId, office, termStart);

  if (candidates.length === 0) return;

  const voteCounts = db
    .prepare(
      `SELECT candidacy_id, COUNT(*) AS votes
       FROM election_votes
       WHERE country_id = ? AND office = ? AND term_start = ?
       GROUP BY candidacy_id`
    )
    .all(countryId, office, termStart);
  const votesByCandidacy = {};
  voteCounts.forEach((row) => {
    votesByCandidacy[row.candidacy_id] = row.votes;
  });

  const ranked = candidates
    .map((c) => ({ ...c, votes: votesByCandidacy[c.candidacy_id] || 0 }))
    .sort((a, b) => b.votes - a.votes || b.total_damage - a.total_damage);

  const winners = office === 'president' ? ranked.slice(0, 1) : ranked.slice(0, seatCount);
  const role = office === 'president' ? 'president' : 'congress_member';

  const install = db.transaction(() => {
    db.prepare('UPDATE offices SET active = 0 WHERE country_id = ? AND role = ? AND active = 1').run(
      countryId,
      role
    );
    if (role === 'congress_member') {
      db.prepare(
        "UPDATE offices SET active = 0 WHERE country_id = ? AND role IN ('general', 'finance_minister', 'secretary_of_state') AND active = 1"
      ).run(countryId);
    }
    const insert = db.prepare(
      'INSERT INTO offices (country_id, role, user_id, term_start) VALUES (?, ?, ?, ?)'
    );
    winners.forEach((winner) => insert.run(countryId, role, winner.user_id, termStart));

    if (role === 'president') {
      db.prepare('UPDATE countries SET president_user_id = ? WHERE id = ?').run(winners[0].user_id, countryId);
    }
  });
  install();
}

function runElectionTick(db) {
  const now = new Date();
  const president = presidentCycle(now);
  const congress = congressCycle(now);

  const countries = db.prepare('SELECT id FROM countries').all();
  countries.forEach((country) => {
    if (president.isElectionDay) {
      tallyOffice(db, country.id, 'president', president.termStart, 1);
    }
    if (congress.isElectionDay) {
      const seats = congressSeatCount(db, country.id);
      tallyOffice(db, country.id, 'congress', congress.termStart, seats);
    }
  });
}

module.exports = {
  CANDIDACY_FEE_GOLD,
  MIN_CONGRESS_SEATS,
  presidentCycle,
  congressCycle,
  congressSeatCount,
  runElectionTick,
};
