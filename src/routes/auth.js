const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const SALT_ROUNDS = 10;

router.get('/register', (req, res) => {
  res.render('register', { error: null, username: '' });
});

router.post('/register', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  if (!USERNAME_RE.test(username)) {
    return res.render('register', {
      error: 'Nome de utilizador deve ter 3-20 caracteres (letras, números, _).',
      username,
    });
  }

  if (password.length < 8) {
    return res.render('register', {
      error: 'A password deve ter pelo menos 8 caracteres.',
      username,
    });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.render('register', { error: 'Esse nome de utilizador já está em uso.', username });
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, passwordHash);

  req.session.userId = result.lastInsertRowid;
  res.redirect('/');
});

router.get('/login', (req, res) => {
  res.render('login', { error: null, username: '' });
});

router.post('/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  const user = db.prepare('SELECT id, password_hash FROM users WHERE username = ?').get(username);
  const passwordMatches = user && bcrypt.compareSync(password, user.password_hash);

  if (!passwordMatches) {
    return res.render('login', { error: 'Utilizador ou password inválidos.', username });
  }

  req.session.userId = user.id;
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
