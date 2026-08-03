const express = require('express');
const db = require('../db');
const {
  CANDIDACY_FEE_GOLD,
  presidentCycle,
  congressCycle,
  congressSeatCount,
} = require('../lib/elections');

const router = express.Router();

const SPECIAL_ROLES = ['general', 'finance_minister', 'secretary_of_state'];
const ROUND_DURATION_MS = 2 * 60 * 60 * 1000;

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function getCountryByCode(code) {
  return db.prepare('SELECT * FROM countries WHERE code = ?').get(code.toUpperCase());
}

function isCitizen(res, country) {
  return res.locals.currentUser && res.locals.currentUser.countryCode === country.code;
}

const ERROR_MESSAGES = {
  not_citizen: 'Only citizens of this country can do that.',
  candidacy_closed: 'Candidacy registration is not open right now.',
  already_candidate: 'You are already a candidate for this term.',
  cannot_afford_candidacy: `You need ${CANDIDACY_FEE_GOLD} Gold to register as a candidate.`,
  voting_closed: 'Voting is not open right now.',
  already_voted: 'You already voted in this election.',
  not_president: 'Only the current President can do that.',
  not_congress_member: 'Choose a valid role and an existing citizen of this country.',
  not_general: 'Only the General can do that.',
  not_finance_minister: 'Only the Finance Minister can do that.',
  invalid_amount: 'Enter a valid amount.',
  not_a_congress_voter: 'Only current congress members can vote on appointments.',
  already_voted_appointment: 'You already voted on this proposal.',
  invalid_defender: 'Choose a different country to declare war on.',
};

function getOffices(countryId) {
  const rows = db
    .prepare(
      `SELECT offices.*, users.username, users.xp
       FROM offices
       JOIN users ON users.id = offices.user_id
       WHERE offices.country_id = ? AND offices.active = 1
       ORDER BY offices.role`
    )
    .all(countryId);
  return {
    president: rows.find((r) => r.role === 'president') || null,
    congress: rows.filter((r) => r.role !== 'president'),
  };
}

router.get('/government/:code', (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();

  const offices = getOffices(country.id);
  const president = presidentCycle(new Date());
  const congress = congressCycle(new Date());
  const seats = congressSeatCount(db, country.id);

  const presidentCandidates = db
    .prepare(
      `SELECT candidacies.id, users.username, users.xp
       FROM candidacies JOIN users ON users.id = candidacies.user_id
       WHERE candidacies.country_id = ? AND candidacies.office = 'president' AND candidacies.term_start = ?`
    )
    .all(country.id, president.termStart);

  const congressCandidates = db
    .prepare(
      `SELECT candidacies.id, users.username, users.xp
       FROM candidacies JOIN users ON users.id = candidacies.user_id
       WHERE candidacies.country_id = ? AND candidacies.office = 'congress' AND candidacies.term_start = ?`
    )
    .all(country.id, congress.termStart);

  const pendingProposals = db
    .prepare(
      `SELECT appointment_proposals.*, users.username AS targetUsername
       FROM appointment_proposals
       JOIN users ON users.id = appointment_proposals.target_user_id
       WHERE appointment_proposals.country_id = ? AND appointment_proposals.status = 'pending'`
    )
    .all(country.id);

  const citizen = isCitizen(res, country);
  const currentUserId = req.session.userId;
  const isPresident = citizen && offices.president && offices.president.user_id === currentUserId;
  const myCongressSeat = citizen ? offices.congress.find((o) => o.user_id === currentUserId) : null;
  const isGeneral = citizen && offices.congress.some((o) => o.role === 'general' && o.user_id === currentUserId);
  const isFinanceMinister =
    citizen && offices.congress.some((o) => o.role === 'finance_minister' && o.user_id === currentUserId);

  const activeWars = db
    .prepare(
      `SELECT wars.*, d.name AS defenderName
       FROM wars JOIN countries d ON d.id = wars.defender_country_id
       WHERE wars.attacker_country_id = ? AND wars.status = 'active'`
    )
    .all(country.id);
  const otherCountries = db.prepare('SELECT id, name FROM countries WHERE id != ? ORDER BY name').all(country.id);

  res.render('government', {
    country,
    offices,
    seats,
    president,
    congress,
    presidentCandidates,
    congressCandidates,
    pendingProposals,
    citizen,
    isPresident,
    myCongressSeat,
    isGeneral,
    isFinanceMinister,
    activeWars,
    otherCountries,
    candidacyFee: CANDIDACY_FEE_GOLD,
    error: ERROR_MESSAGES[req.query.error] || null,
    message: req.query.ok || null,
  });
});

router.post('/government/:code/candidacy', requireLogin, (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();
  if (!isCitizen(res, country)) return res.redirect(`/government/${country.code}?error=not_citizen`);

  const office = req.body.office === 'president' ? 'president' : 'congress';
  const cycle = office === 'president' ? presidentCycle(new Date()) : congressCycle(new Date());

  if (!cycle.candidacyOpen) return res.redirect(`/government/${country.code}?error=candidacy_closed`);

  const existing = db
    .prepare('SELECT id FROM candidacies WHERE country_id = ? AND office = ? AND user_id = ? AND term_start = ?')
    .get(country.id, office, req.session.userId, cycle.termStart);
  if (existing) return res.redirect(`/government/${country.code}?error=already_candidate`);

  const user = db.prepare('SELECT gold FROM users WHERE id = ?').get(req.session.userId);
  if (user.gold < CANDIDACY_FEE_GOLD) {
    return res.redirect(`/government/${country.code}?error=cannot_afford_candidacy`);
  }

  const register = db.transaction(() => {
    db.prepare('UPDATE users SET gold = gold - ? WHERE id = ?').run(CANDIDACY_FEE_GOLD, req.session.userId);
    db.prepare(
      'INSERT INTO candidacies (country_id, office, user_id, term_start) VALUES (?, ?, ?, ?)'
    ).run(country.id, office, req.session.userId, cycle.termStart);
  });
  register();

  res.redirect(`/government/${country.code}?ok=Registered as a candidate.`);
});

router.post('/government/:code/vote', requireLogin, (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();
  if (!isCitizen(res, country)) return res.redirect(`/government/${country.code}?error=not_citizen`);

  const candidacy = db.prepare('SELECT * FROM candidacies WHERE id = ?').get(req.body.candidacy_id);
  if (!candidacy || candidacy.country_id !== country.id) return next();

  const cycle = candidacy.office === 'president' ? presidentCycle(new Date()) : congressCycle(new Date());
  if (!cycle.isElectionDay || cycle.termStart !== candidacy.term_start) {
    return res.redirect(`/government/${country.code}?error=voting_closed`);
  }

  const existingVote = db
    .prepare('SELECT id FROM election_votes WHERE country_id = ? AND office = ? AND term_start = ? AND voter_id = ?')
    .get(country.id, candidacy.office, candidacy.term_start, req.session.userId);
  if (existingVote) return res.redirect(`/government/${country.code}?error=already_voted`);

  db.prepare(
    'INSERT INTO election_votes (country_id, office, term_start, voter_id, candidacy_id) VALUES (?, ?, ?, ?, ?)'
  ).run(country.id, candidacy.office, candidacy.term_start, req.session.userId, candidacy.id);

  res.redirect(`/government/${country.code}?ok=Vote cast.`);
});

router.post('/government/:code/appoint', requireLogin, (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();

  if (country.president_user_id !== req.session.userId) {
    return res.redirect(`/government/${country.code}?error=not_president`);
  }

  const role = SPECIAL_ROLES.includes(req.body.role) ? req.body.role : null;
  // Any citizen of the country can be appointed — not only sitting congress
  // members. If the appointee isn't already a congress member, approval adds
  // them as an extra seat acting as congress (see appointment vote handler).
  const target = db
    .prepare('SELECT * FROM users WHERE username = ? AND country_id = ?')
    .get(req.body.target_username, country.id);

  if (!role || !target) {
    return res.redirect(`/government/${country.code}?error=not_congress_member`);
  }

  db.prepare(
    'INSERT INTO appointment_proposals (country_id, role, target_user_id, proposed_by) VALUES (?, ?, ?, ?)'
  ).run(country.id, role, target.id, req.session.userId);

  res.redirect(`/government/${country.code}?ok=Appointment proposed to Congress.`);
});

router.post('/government/:code/appointment/:id/vote', requireLogin, (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();

  const proposal = db
    .prepare("SELECT * FROM appointment_proposals WHERE id = ? AND country_id = ? AND status = 'pending'")
    .get(req.params.id, country.id);
  if (!proposal) return next();

  const voterSeat = db
    .prepare("SELECT id FROM offices WHERE country_id = ? AND user_id = ? AND active = 1 AND role != 'president'")
    .get(country.id, req.session.userId);
  if (!voterSeat) return res.redirect(`/government/${country.code}?error=not_a_congress_voter`);

  const existingVote = db
    .prepare('SELECT id FROM appointment_votes WHERE proposal_id = ? AND voter_id = ?')
    .get(proposal.id, req.session.userId);
  if (existingVote) return res.redirect(`/government/${country.code}?error=already_voted_appointment`);

  const vote = req.body.vote === 'yes' ? 'yes' : 'no';

  db.prepare('INSERT INTO appointment_votes (proposal_id, voter_id, vote) VALUES (?, ?, ?)').run(
    proposal.id,
    req.session.userId,
    vote
  );

  const totalSeats = db
    .prepare("SELECT COUNT(*) AS c FROM offices WHERE country_id = ? AND active = 1 AND role != 'president'")
    .get(country.id).c;
  const yesVotes = db
    .prepare("SELECT COUNT(*) AS c FROM appointment_votes WHERE proposal_id = ? AND vote = 'yes'")
    .get(proposal.id).c;
  const noVotes = db
    .prepare("SELECT COUNT(*) AS c FROM appointment_votes WHERE proposal_id = ? AND vote = 'no'")
    .get(proposal.id).c;
  const majority = Math.floor(totalSeats / 2) + 1;

  if (yesVotes >= majority) {
    const resolve = db.transaction(() => {
      db.prepare("UPDATE appointment_proposals SET status = 'approved' WHERE id = ?").run(proposal.id);

      const existingOffice = db
        .prepare('SELECT id FROM offices WHERE country_id = ? AND user_id = ? AND active = 1')
        .get(country.id, proposal.target_user_id);

      if (existingOffice) {
        db.prepare('UPDATE offices SET role = ? WHERE id = ?').run(proposal.role, existingOffice.id);
      } else {
        // Appointee wasn't a sitting congress member — they gain a seat,
        // acting as congress for as long as they hold the special role.
        const congressTermStart = congressCycle(new Date()).termStart;
        db.prepare(
          'INSERT INTO offices (country_id, role, user_id, term_start) VALUES (?, ?, ?, ?)'
        ).run(country.id, proposal.role, proposal.target_user_id, congressTermStart);
      }
    });
    resolve();
  } else if (noVotes > totalSeats - majority) {
    db.prepare("UPDATE appointment_proposals SET status = 'rejected' WHERE id = ?").run(proposal.id);
  }

  res.redirect(`/government/${country.code}`);
});

router.post('/government/:code/print-currency', requireLogin, (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();

  const isFinanceMinister = db
    .prepare("SELECT id FROM offices WHERE country_id = ? AND user_id = ? AND role = 'finance_minister' AND active = 1")
    .get(country.id, req.session.userId);
  if (!isFinanceMinister) return res.redirect(`/government/${country.code}?error=not_finance_minister`);

  const amount = parseInt(req.body.amount, 10);
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.redirect(`/government/${country.code}?error=invalid_amount`);
  }

  db.prepare('UPDATE countries SET treasury = treasury + ? WHERE id = ?').run(amount, country.id);

  res.redirect(`/government/${country.code}?ok=Currency printed into the treasury.`);
});

router.post('/government/:code/declare-war', requireLogin, (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();

  const isGeneral = db
    .prepare("SELECT id FROM offices WHERE country_id = ? AND user_id = ? AND role = 'general' AND active = 1")
    .get(country.id, req.session.userId);
  if (!isGeneral) return res.redirect(`/government/${country.code}?error=not_general`);

  const defender = db.prepare('SELECT * FROM countries WHERE id = ?').get(req.body.defender_country_id);
  if (!defender || defender.id === country.id) {
    return res.redirect(`/government/${country.code}?error=invalid_defender`);
  }

  const war = db
    .prepare('INSERT INTO wars (attacker_country_id, defender_country_id) VALUES (?, ?)')
    .run(country.id, defender.id);

  res.redirect(`/government/${country.code}?ok=War declared. War #${war.lastInsertRowid}.`);
});

router.post('/government/:code/wars/:warId/battles', requireLogin, (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();

  const isGeneral = db
    .prepare("SELECT id FROM offices WHERE country_id = ? AND user_id = ? AND role = 'general' AND active = 1")
    .get(country.id, req.session.userId);
  if (!isGeneral) return res.redirect(`/government/${country.code}?error=not_general`);

  const war = db
    .prepare("SELECT * FROM wars WHERE id = ? AND attacker_country_id = ? AND status = 'active'")
    .get(req.params.warId, country.id);
  if (!war) return next();

  const region = db
    .prepare('SELECT id FROM regions WHERE id = ? AND country_id = ?')
    .get(req.body.region_id, war.defender_country_id);
  if (!region) return res.redirect(`/government/${country.code}?error=invalid_defender`);

  const battle = db
    .prepare(
      `INSERT INTO battles (war_id, attacker_country_id, defender_country_id, region_id, round_duration_ms)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(war.id, war.attacker_country_id, war.defender_country_id, region.id, ROUND_DURATION_MS);

  res.redirect(`/battles/${battle.lastInsertRowid}`);
});

module.exports = router;
