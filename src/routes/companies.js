const express = require('express');
const db = require('../db');
const goods = require('../db/goods-data');
const { nationalCurrencyName } = require('../lib/currency');

const router = express.Router();

const MAX_QUALITY = 6;
const CREATION_COST_GOLD = 50;
const CREATION_COST_NATIONAL = 50;
const WORK_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function goodByKey(key) {
  return goods.find((good) => good.key === key);
}

function unitsPerWork(qualityLevel) {
  return qualityLevel * 10;
}

function upgradeCost(currentQualityLevel) {
  return currentQualityLevel * 100;
}

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

const ERROR_MESSAGES = {
  not_employed_here: "You don't work at this company.",
  cooldown: 'You already worked in the last 24 hours.',
  owner_cannot_afford: "The owner can't afford your salary right now.",
  cannot_afford_upgrade: "You don't have enough currency for this upgrade.",
};

function companyWithDetails(company) {
  const good = goodByKey(company.good_key);
  const job = db.prepare('SELECT worker_id FROM jobs WHERE company_id = ?').get(company.id);
  return {
    ...company,
    goodName: good.name,
    goodCategory: good.category,
    currencyName: nationalCurrencyName(company.countryName),
    workerId: job ? job.worker_id : null,
  };
}

router.get('/companies', (req, res) => {
  const companies = db
    .prepare(
      `SELECT companies.*, countries.name AS countryName, regions.name AS regionName, users.username AS ownerUsername
       FROM companies
       JOIN countries ON countries.id = companies.country_id
       JOIN regions ON regions.id = companies.region_id
       JOIN users ON users.id = companies.owner_id
       ORDER BY companies.created_at DESC`
    )
    .all()
    .map(companyWithDetails);

  res.render('companies', { companies });
});

router.get('/companies/new', requireLogin, (req, res) => {
  const owner = db.prepare('SELECT country_id FROM users WHERE id = ?').get(req.session.userId);
  const regions = db
    .prepare('SELECT id, name FROM regions WHERE country_id = ? ORDER BY is_capital DESC, name')
    .all(owner.country_id);

  res.render('company-new', {
    error: null,
    goods,
    regions,
    creationCostGold: CREATION_COST_GOLD,
    creationCostNational: CREATION_COST_NATIONAL,
  });
});

router.post('/companies', requireLogin, (req, res) => {
  const owner = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  const regions = db
    .prepare('SELECT id, name FROM regions WHERE country_id = ? ORDER BY is_capital DESC, name')
    .all(owner.country_id);

  const good = goodByKey(req.body.good_key);
  const region = regions.find((r) => String(r.id) === String(req.body.region_id));
  const salary = parseInt(req.body.salary, 10);
  const renderArgs = { goods, regions, creationCostGold: CREATION_COST_GOLD, creationCostNational: CREATION_COST_NATIONAL };

  if (!good) {
    return res.render('company-new', { error: 'Please choose a valid good.', ...renderArgs });
  }
  if (!region) {
    return res.render('company-new', { error: 'Please choose a valid region.', ...renderArgs });
  }
  if (!Number.isInteger(salary) || salary < 0) {
    return res.render('company-new', { error: 'Salary must be a non-negative whole number.', ...renderArgs });
  }
  if (owner.gold < CREATION_COST_GOLD || owner.national_currency < CREATION_COST_NATIONAL) {
    return res.render('company-new', {
      error: `You need at least ${CREATION_COST_GOLD} Gold and ${CREATION_COST_NATIONAL} of your national currency to start a company.`,
      ...renderArgs,
    });
  }

  const createCompany = db.transaction(() => {
    db.prepare('UPDATE users SET gold = gold - ?, national_currency = national_currency - ? WHERE id = ?').run(
      CREATION_COST_GOLD,
      CREATION_COST_NATIONAL,
      owner.id
    );
    return db
      .prepare(
        'INSERT INTO companies (owner_id, good_key, quality_level, salary, country_id, region_id) VALUES (?, ?, 1, ?, ?, ?)'
      )
      .run(owner.id, good.key, salary, owner.country_id, region.id);
  });

  const result = createCompany();
  res.redirect(`/companies/${result.lastInsertRowid}`);
});

router.get('/companies/:id', (req, res, next) => {
  const company = db
    .prepare(
      `SELECT companies.*, countries.name AS countryName, regions.name AS regionName, users.username AS ownerUsername
       FROM companies
       JOIN countries ON countries.id = companies.country_id
       JOIN regions ON regions.id = companies.region_id
       JOIN users ON users.id = companies.owner_id
       WHERE companies.id = ?`
    )
    .get(req.params.id);

  if (!company) return next();

  const job = db
    .prepare('SELECT jobs.*, users.username AS workerUsername FROM jobs JOIN users ON users.id = jobs.worker_id WHERE company_id = ?')
    .get(company.id);

  res.render('company', {
    company: companyWithDetails(company),
    job,
    unitsPerWork: unitsPerWork(company.quality_level),
    upgradeCost: company.quality_level < MAX_QUALITY ? upgradeCost(company.quality_level) : null,
    maxQuality: MAX_QUALITY,
    error: ERROR_MESSAGES[req.query.error] || null,
  });
});

router.post('/companies/:id/apply', requireLogin, (req, res, next) => {
  const company = db.prepare('SELECT id FROM companies WHERE id = ?').get(req.params.id);
  if (!company) return next();

  const existingJobAtCompany = db.prepare('SELECT id FROM jobs WHERE company_id = ?').get(company.id);
  const workerAlreadyEmployed = db.prepare('SELECT id FROM jobs WHERE worker_id = ?').get(req.session.userId);

  if (!existingJobAtCompany && !workerAlreadyEmployed) {
    db.prepare('INSERT INTO jobs (company_id, worker_id) VALUES (?, ?)').run(company.id, req.session.userId);
  }

  res.redirect(`/companies/${company.id}`);
});

router.post('/companies/:id/work', requireLogin, (req, res, next) => {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) return next();

  const job = db.prepare('SELECT * FROM jobs WHERE company_id = ? AND worker_id = ?').get(company.id, req.session.userId);
  if (!job) return res.redirect(`/companies/${company.id}?error=not_employed_here`);

  if (job.last_worked_at) {
    const elapsed = Date.now() - new Date(job.last_worked_at.replace(' ', 'T') + 'Z').getTime();
    if (elapsed < WORK_COOLDOWN_MS) return res.redirect(`/companies/${company.id}?error=cooldown`);
  }

  const owner = db.prepare('SELECT * FROM users WHERE id = ?').get(company.owner_id);
  if (owner.national_currency < company.salary) return res.redirect(`/companies/${company.id}?error=owner_cannot_afford`);

  const work = db.transaction(() => {
    db.prepare('UPDATE users SET national_currency = national_currency - ? WHERE id = ?').run(company.salary, owner.id);
    db.prepare('UPDATE users SET national_currency = national_currency + ? WHERE id = ?').run(company.salary, req.session.userId);
    db.prepare('UPDATE companies SET inventory = inventory + ? WHERE id = ?').run(unitsPerWork(company.quality_level), company.id);
    db.prepare("UPDATE jobs SET last_worked_at = datetime('now') WHERE id = ?").run(job.id);
  });
  work();

  res.redirect(`/companies/${company.id}`);
});

router.post('/companies/:id/upgrade', requireLogin, (req, res, next) => {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) return next();
  if (company.owner_id !== req.session.userId) return res.redirect(`/companies/${company.id}`);
  if (company.quality_level >= MAX_QUALITY) return res.redirect(`/companies/${company.id}`);

  const cost = upgradeCost(company.quality_level);
  const owner = db.prepare('SELECT * FROM users WHERE id = ?').get(company.owner_id);
  if (owner.national_currency < cost) return res.redirect(`/companies/${company.id}?error=cannot_afford_upgrade`);

  const upgrade = db.transaction(() => {
    db.prepare('UPDATE users SET national_currency = national_currency - ? WHERE id = ?').run(cost, owner.id);
    db.prepare('UPDATE companies SET quality_level = quality_level + 1 WHERE id = ?').run(company.id);
  });
  upgrade();

  res.redirect(`/companies/${company.id}`);
});

module.exports = router;
