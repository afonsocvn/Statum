const path = require('node:path');
const express = require('express');
const session = require('express-session');
const db = require('./db');
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');

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
  res.locals.currentUser = req.session.userId
    ? db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.session.userId)
    : null;
  next();
});

app.use('/', authRouter);
app.use('/', indexRouter);

app.use((req, res) => {
  res.status(404).render('404');
});

module.exports = app;
