const path = require('node:path');
const express = require('express');
const session = require('express-session');
const db = require('./db');
const { nationalCurrencyName } = require('./lib/currency');
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const countriesRouter = require('./routes/countries');
const companiesRouter = require('./routes/companies');
const marketRouter = require('./routes/market');
const trainingRouter = require('./routes/training');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-muda-em-producao',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

app.use((req, res, next) => {
  const user = req.session.userId
    ? db
        .prepare(
          `SELECT users.id, users.username, users.gold, users.national_currency AS nationalCurrency,
                  countries.name AS countryName, countries.code AS countryCode, regions.name AS regionName
           FROM users
           JOIN countries ON countries.id = users.country_id
           JOIN regions ON regions.id = users.region_id
           WHERE users.id = ?`
        )
        .get(req.session.userId)
    : null;

  res.locals.currentUser = user
    ? { ...user, nationalCurrencyName: nationalCurrencyName(user.countryName) }
    : null;
  next();
});

app.use('/', authRouter);
app.use('/', countriesRouter);
app.use('/', companiesRouter);
app.use('/', marketRouter);
app.use('/', trainingRouter);
app.use('/', indexRouter);

app.use((req, res) => {
  res.status(404).render('404');
});

module.exports = app;
