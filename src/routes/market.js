const express = require('express');
const db = require('../db');
const goods = require('../db/goods-data');
const { nationalCurrencyName } = require('../lib/currency');

const router = express.Router();

const SALES_TAX_RATE = 0.05;

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function goodByKey(key) {
  return goods.find((good) => good.key === key);
}

function getCountryByCode(code) {
  return db.prepare('SELECT * FROM countries WHERE code = ?').get(code.toUpperCase());
}

const ERROR_MESSAGES = {
  not_citizen: 'Only citizens of this country can trade on its market.',
  invalid_company: 'Please choose one of your own companies in this country with goods in stock.',
  invalid_quantity: 'Please enter a valid quantity.',
  invalid_price: 'Please enter a valid price.',
  not_enough_gold: "You don't have that much Gold.",
  cannot_afford: "You don't have enough currency for this purchase.",
  listing_not_found: 'That listing no longer exists.',
  not_enough_stock: 'That listing no longer has enough stock.',
};

router.get('/market', (req, res) => {
  const countries = db.prepare('SELECT name, code FROM countries ORDER BY name').all();
  res.render('market-countries', { countries });
});

router.get('/market/:code', (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();

  const currencyName = nationalCurrencyName(country.name);
  const isCitizen = res.locals.currentUser && res.locals.currentUser.countryCode === country.code;

  const goodListings = db
    .prepare(
      `SELECT market_listings.*, users.username AS sellerUsername
       FROM market_listings
       JOIN users ON users.id = market_listings.seller_id
       WHERE market_listings.country_id = ? AND market_listings.item_type = 'good'
       ORDER BY market_listings.good_key, market_listings.price_per_unit ASC`
    )
    .all(country.id)
    .map((listing) => ({ ...listing, goodName: goodByKey(listing.good_key).name }));

  const goldListings = db
    .prepare(
      `SELECT market_listings.*, users.username AS sellerUsername
       FROM market_listings
       JOIN users ON users.id = market_listings.seller_id
       WHERE market_listings.country_id = ? AND market_listings.item_type = 'gold'
       ORDER BY market_listings.price_per_unit ASC`
    )
    .all(country.id);

  let ownCompanies = [];
  let ownInventory = [];
  let ownGold = 0;

  if (isCitizen) {
    ownCompanies = db
      .prepare('SELECT id, good_key, inventory FROM companies WHERE owner_id = ? AND country_id = ? AND inventory > 0')
      .all(req.session.userId, country.id)
      .map((company) => ({ ...company, goodName: goodByKey(company.good_key).name }));

    ownInventory = db
      .prepare('SELECT good_key, quantity FROM user_inventory WHERE user_id = ? AND quantity > 0')
      .all(req.session.userId)
      .map((row) => ({ ...row, goodName: goodByKey(row.good_key).name }));

    ownGold = db.prepare('SELECT gold FROM users WHERE id = ?').get(req.session.userId).gold;
  }

  res.render('market', {
    country,
    currencyName,
    isCitizen,
    goodListings,
    goldListings,
    ownCompanies,
    ownInventory,
    ownGold,
    error: ERROR_MESSAGES[req.query.error] || null,
  });
});

router.post('/market/:code/listings/good', requireLogin, (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();
  if (res.locals.currentUser.countryCode !== country.code) {
    return res.redirect(`/market/${country.code}?error=not_citizen`);
  }

  const company = db
    .prepare('SELECT * FROM companies WHERE id = ? AND owner_id = ? AND country_id = ?')
    .get(req.body.company_id, req.session.userId, country.id);
  const quantity = parseInt(req.body.quantity, 10);
  const price = parseInt(req.body.price, 10);

  if (!company || company.inventory <= 0) return res.redirect(`/market/${country.code}?error=invalid_company`);
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > company.inventory) {
    return res.redirect(`/market/${country.code}?error=invalid_quantity`);
  }
  if (!Number.isInteger(price) || price <= 0) return res.redirect(`/market/${country.code}?error=invalid_price`);

  const createListing = db.transaction(() => {
    db.prepare('UPDATE companies SET inventory = inventory - ? WHERE id = ?').run(quantity, company.id);
    db.prepare(
      `INSERT INTO market_listings (seller_id, country_id, item_type, good_key, source_company_id, quantity, price_per_unit)
       VALUES (?, ?, 'good', ?, ?, ?, ?)`
    ).run(req.session.userId, country.id, company.good_key, company.id, quantity, price);
  });
  createListing();

  res.redirect(`/market/${country.code}`);
});

router.post('/market/:code/listings/gold', requireLogin, (req, res, next) => {
  const country = getCountryByCode(req.params.code);
  if (!country) return next();
  if (res.locals.currentUser.countryCode !== country.code) {
    return res.redirect(`/market/${country.code}?error=not_citizen`);
  }

  const seller = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  const quantity = parseInt(req.body.quantity, 10);
  const price = parseInt(req.body.price, 10);

  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > seller.gold) {
    return res.redirect(`/market/${country.code}?error=not_enough_gold`);
  }
  if (!Number.isInteger(price) || price <= 0) return res.redirect(`/market/${country.code}?error=invalid_price`);

  const createListing = db.transaction(() => {
    db.prepare('UPDATE users SET gold = gold - ? WHERE id = ?').run(quantity, seller.id);
    db.prepare(
      `INSERT INTO market_listings (seller_id, country_id, item_type, good_key, quantity, price_per_unit)
       VALUES (?, ?, 'gold', NULL, ?, ?)`
    ).run(seller.id, country.id, quantity, price);
  });
  createListing();

  res.redirect(`/market/${country.code}`);
});

router.post('/market/listings/:id/buy', requireLogin, (req, res, next) => {
  const listing = db.prepare('SELECT * FROM market_listings WHERE id = ?').get(req.params.id);
  if (!listing) return next();

  const country = db.prepare('SELECT * FROM countries WHERE id = ?').get(listing.country_id);
  if (res.locals.currentUser.countryCode !== country.code) {
    return res.redirect(`/market/${country.code}?error=not_citizen`);
  }

  const quantity = parseInt(req.body.quantity, 10);
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > listing.quantity) {
    return res.redirect(`/market/${country.code}?error=not_enough_stock`);
  }

  const totalPrice = quantity * listing.price_per_unit;
  const buyer = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (buyer.national_currency < totalPrice) {
    return res.redirect(`/market/${country.code}?error=cannot_afford`);
  }

  const tax = listing.item_type === 'good' ? Math.floor(totalPrice * SALES_TAX_RATE) : 0;
  const sellerProceeds = totalPrice - tax;

  const buy = db.transaction(() => {
    db.prepare('UPDATE users SET national_currency = national_currency - ? WHERE id = ?').run(totalPrice, buyer.id);
    db.prepare('UPDATE users SET national_currency = national_currency + ? WHERE id = ?').run(sellerProceeds, listing.seller_id);
    if (tax > 0) {
      db.prepare('UPDATE countries SET treasury = treasury + ? WHERE id = ?').run(tax, country.id);
    }

    if (listing.item_type === 'gold') {
      db.prepare('UPDATE users SET gold = gold + ? WHERE id = ?').run(quantity, buyer.id);
    } else {
      db.prepare(
        `INSERT INTO user_inventory (user_id, good_key, quantity) VALUES (?, ?, ?)
         ON CONFLICT(user_id, good_key) DO UPDATE SET quantity = quantity + excluded.quantity`
      ).run(buyer.id, listing.good_key, quantity);
    }

    const remaining = listing.quantity - quantity;
    if (remaining > 0) {
      db.prepare('UPDATE market_listings SET quantity = ? WHERE id = ?').run(remaining, listing.id);
    } else {
      db.prepare('DELETE FROM market_listings WHERE id = ?').run(listing.id);
    }
  });
  buy();

  res.redirect(`/market/${country.code}`);
});

module.exports = router;
