const express = require('express');
const db = require('../db');
const { awardXp, XP_BUG_REPORT } = require('../lib/xp');

const router = express.Router();

const BUG_REPORT_GOLD = 10;

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!res.locals.currentUser || !res.locals.currentUser.isAdmin) {
    return res.status(403).send('Admin only.');
  }
  next();
}

router.get('/bugs/report', requireLogin, (req, res) => {
  res.render('bug-report', { error: null });
});

router.post('/bugs/report', requireLogin, (req, res) => {
  const description = (req.body.description || '').trim();
  if (!description) {
    return res.render('bug-report', { error: 'Please describe the bug.' });
  }

  db.prepare('INSERT INTO bug_reports (reporter_id, description) VALUES (?, ?)').run(
    req.session.userId,
    description
  );

  res.redirect('/bugs/report?ok=1');
});

router.get('/admin/bugs', requireAdmin, (req, res) => {
  const reports = db
    .prepare(
      `SELECT bug_reports.*, users.username AS reporterUsername
       FROM bug_reports JOIN users ON users.id = bug_reports.reporter_id
       ORDER BY bug_reports.status = 'pending' DESC, bug_reports.created_at DESC`
    )
    .all();
  res.render('admin-bugs', { reports });
});

router.post('/admin/bugs/:id/reward', requireAdmin, (req, res, next) => {
  const report = db.prepare("SELECT * FROM bug_reports WHERE id = ? AND status = 'pending'").get(req.params.id);
  if (!report) return next();

  const resolve = db.transaction(() => {
    db.prepare("UPDATE bug_reports SET status = 'rewarded' WHERE id = ?").run(report.id);
    db.prepare('UPDATE users SET gold = gold + ? WHERE id = ?').run(BUG_REPORT_GOLD, report.reporter_id);
  });
  resolve();
  awardXp(report.reporter_id, XP_BUG_REPORT);

  res.redirect('/admin/bugs');
});

router.post('/admin/bugs/:id/reject', requireAdmin, (req, res, next) => {
  const report = db.prepare("SELECT * FROM bug_reports WHERE id = ? AND status = 'pending'").get(req.params.id);
  if (!report) return next();

  db.prepare("UPDATE bug_reports SET status = 'rejected' WHERE id = ?").run(report.id);

  res.redirect('/admin/bugs');
});

module.exports = router;
