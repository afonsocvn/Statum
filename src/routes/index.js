const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const meta = db.prepare('SELECT value FROM schema_meta WHERE key = ?').get('schema_version');
  res.render('index', { schemaVersion: meta ? meta.value : 'desconhecida' });
});

module.exports = router;
