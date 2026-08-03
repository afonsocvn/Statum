const express = require('express');
const db = require('../db');
const { awardXp, XP_JOURNALIST_MILESTONE } = require('../lib/xp');

const router = express.Router();

const SUBSCRIBER_TIER_SIZE = 50;
const GOLD_PER_TIER = 5;
const LIKE_GOLD_RATE = 0.05; // 5% of likes, in Gold (100 likes = 5 Gold)

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

router.get('/press', (req, res) => {
  const articles = db
    .prepare(
      `SELECT articles.*, users.username AS authorUsername
       FROM articles JOIN users ON users.id = articles.author_id
       ORDER BY articles.created_at DESC`
    )
    .all();

  const likedArticleIds = req.session.userId
    ? new Set(
        db
          .prepare('SELECT article_id FROM article_likes WHERE user_id = ?')
          .all(req.session.userId)
          .map((r) => r.article_id)
      )
    : new Set();

  res.render('press', { articles, likedArticleIds });
});

router.get('/press/new', requireLogin, (req, res) => {
  res.render('press-new', { error: null });
});

router.post('/press', requireLogin, (req, res) => {
  const title = (req.body.title || '').trim();
  const body = (req.body.body || '').trim();

  if (!title || !body) {
    return res.render('press-new', { error: 'Title and body are required.' });
  }

  const result = db
    .prepare('INSERT INTO articles (author_id, title, body) VALUES (?, ?, ?)')
    .run(req.session.userId, title, body);

  res.redirect(`/press#article-${result.lastInsertRowid}`);
});

router.post('/press/:id/like', requireLogin, (req, res, next) => {
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!article) return next();

  const alreadyLiked = db
    .prepare('SELECT 1 FROM article_likes WHERE article_id = ? AND user_id = ?')
    .get(article.id, req.session.userId);
  if (alreadyLiked) return res.redirect('/press');

  const goldBefore = Math.floor(article.likes_count * LIKE_GOLD_RATE);
  const goldAfter = Math.floor((article.likes_count + 1) * LIKE_GOLD_RATE);
  const marginalGold = goldAfter - goldBefore;

  const like = db.transaction(() => {
    db.prepare('INSERT INTO article_likes (article_id, user_id) VALUES (?, ?)').run(article.id, req.session.userId);
    db.prepare('UPDATE articles SET likes_count = likes_count + 1, gold_earned = gold_earned + ? WHERE id = ?').run(
      marginalGold,
      article.id
    );
    if (marginalGold > 0) {
      db.prepare('UPDATE users SET gold = gold + ? WHERE id = ?').run(marginalGold, article.author_id);
    }
  });
  like();

  res.redirect('/press');
});

router.get('/press/journalists/:username', (req, res, next) => {
  const journalist = db.prepare('SELECT id, username FROM users WHERE username = ?').get(req.params.username);
  if (!journalist) return next();

  const articles = db
    .prepare('SELECT * FROM articles WHERE author_id = ? ORDER BY created_at DESC')
    .all(journalist.id);
  const subscriberCount = db
    .prepare('SELECT COUNT(*) AS c FROM journalist_subscriptions WHERE journalist_id = ?')
    .get(journalist.id).c;
  const isSubscribed = req.session.userId
    ? !!db
        .prepare('SELECT 1 FROM journalist_subscriptions WHERE journalist_id = ? AND subscriber_id = ?')
        .get(journalist.id, req.session.userId)
    : false;

  res.render('journalist', { journalist, articles, subscriberCount, isSubscribed });
});

router.post('/press/journalists/:username/subscribe', requireLogin, (req, res, next) => {
  const journalist = db.prepare('SELECT id, username FROM users WHERE username = ?').get(req.params.username);
  if (!journalist) return next();
  if (journalist.id === req.session.userId) return res.redirect(`/press/journalists/${journalist.username}`);

  const already = db
    .prepare('SELECT 1 FROM journalist_subscriptions WHERE journalist_id = ? AND subscriber_id = ?')
    .get(journalist.id, req.session.userId);

  if (!already) {
    db.prepare('INSERT INTO journalist_subscriptions (journalist_id, subscriber_id) VALUES (?, ?)').run(
      journalist.id,
      req.session.userId
    );

    const subscriberCount = db
      .prepare('SELECT COUNT(*) AS c FROM journalist_subscriptions WHERE journalist_id = ?')
      .get(journalist.id).c;
    const tier = Math.floor(subscriberCount / SUBSCRIBER_TIER_SIZE) * SUBSCRIBER_TIER_SIZE;

    if (tier > 0) {
      const alreadyPaid = db
        .prepare('SELECT 1 FROM journalist_milestones WHERE journalist_id = ? AND tier = ?')
        .get(journalist.id, tier);
      if (!alreadyPaid) {
        const goldReward = (tier / SUBSCRIBER_TIER_SIZE) * GOLD_PER_TIER;
        db.prepare('INSERT INTO journalist_milestones (journalist_id, tier) VALUES (?, ?)').run(
          journalist.id,
          tier
        );
        db.prepare('UPDATE users SET gold = gold + ? WHERE id = ?').run(goldReward, journalist.id);
        awardXp(journalist.id, XP_JOURNALIST_MILESTONE);
      }
    }
  }

  res.redirect(`/press/journalists/${journalist.username}`);
});

router.post('/press/journalists/:username/unsubscribe', requireLogin, (req, res, next) => {
  const journalist = db.prepare('SELECT id, username FROM users WHERE username = ?').get(req.params.username);
  if (!journalist) return next();

  db.prepare('DELETE FROM journalist_subscriptions WHERE journalist_id = ? AND subscriber_id = ?').run(
    journalist.id,
    req.session.userId
  );

  res.redirect(`/press/journalists/${journalist.username}`);
});

module.exports = router;
