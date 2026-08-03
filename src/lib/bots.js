const goods = require('../db/goods-data');

const BOT_STARTING_GOLD = 1000;
const BOT_STARTING_NATIONAL_CURRENCY = 1000;
const WORK_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const BASE_PRICES = {
  grain: 2,
  iron: 4,
  oil: 5,
  timber: 3,
  food: 6,
  weapons: 12,
  fuel: 8,
  furniture: 7,
};

function unitsPerWork(qualityLevel) {
  return qualityLevel * 10;
}

function seedBots(db) {
  const countries = db.prepare('SELECT * FROM countries ORDER BY id').all();

  countries.forEach((country, index) => {
    const username = `bot_${country.code}`;
    let bot = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!bot) {
      const capital = db.prepare('SELECT id FROM regions WHERE country_id = ? AND is_capital = 1').get(country.id);
      const result = db
        .prepare(
          `INSERT INTO users (username, password_hash, country_id, region_id, gold, national_currency, is_bot)
           VALUES (?, 'bot', ?, ?, ?, ?, 1)`
        )
        .run(username, country.id, capital.id, BOT_STARTING_GOLD, BOT_STARTING_NATIONAL_CURRENCY);
      bot = { id: result.lastInsertRowid, country_id: country.id, region_id: capital.id };
    }

    const existingCompany = db.prepare('SELECT id FROM companies WHERE owner_id = ?').get(bot.id);
    if (!existingCompany) {
      const good = goods[index % goods.length];
      const companyResult = db
        .prepare(
          'INSERT INTO companies (owner_id, good_key, quality_level, salary, country_id, region_id) VALUES (?, ?, 1, 0, ?, ?)'
        )
        .run(bot.id, good.key, country.id, bot.region_id);
      db.prepare('INSERT INTO jobs (company_id, worker_id) VALUES (?, ?)').run(companyResult.lastInsertRowid, bot.id);
    }
  });
}

function runBotTick(db) {
  const bots = db.prepare('SELECT * FROM users WHERE is_bot = 1').all();

  bots.forEach((bot) => {
    const company = db.prepare('SELECT * FROM companies WHERE owner_id = ?').get(bot.id);
    if (!company) return;

    const job = db.prepare('SELECT * FROM jobs WHERE company_id = ?').get(company.id);
    if (!job) return;

    const eligible =
      !job.last_worked_at ||
      Date.now() - new Date(job.last_worked_at.replace(' ', 'T') + 'Z').getTime() >= WORK_COOLDOWN_MS;
    if (!eligible) return;

    const produced = unitsPerWork(company.quality_level);

    const work = db.transaction(() => {
      db.prepare('UPDATE companies SET inventory = inventory + ? WHERE id = ?').run(produced, company.id);
      db.prepare("UPDATE jobs SET last_worked_at = datetime('now') WHERE id = ?").run(job.id);
    });
    work();

    const updatedCompany = db.prepare('SELECT inventory FROM companies WHERE id = ?').get(company.id);
    if (updatedCompany.inventory > 0) {
      const price = BASE_PRICES[company.good_key];
      const listAndClear = db.transaction(() => {
        db.prepare(
          `INSERT INTO market_listings (seller_id, country_id, item_type, good_key, quality_level, source_company_id, quantity, price_per_unit)
           VALUES (?, ?, 'good', ?, ?, ?, ?, ?)`
        ).run(bot.id, bot.country_id, company.good_key, company.quality_level, company.id, updatedCompany.inventory, price);
        db.prepare('UPDATE companies SET inventory = 0 WHERE id = ?').run(company.id);
      });
      listAndClear();
    }
  });
}

module.exports = { seedBots, runBotTick };
