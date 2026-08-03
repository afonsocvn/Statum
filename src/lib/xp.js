// Level curve: cumulative XP needed for level n is 25 * n * (n-1).
// Level 1=0, 2=50, 3=150, 4=300, 5=500, 6=750, 7=1050, 8=1400, 9=1800, 10=2250...
// Numbers below are assumptions — see docs/decisions.md.

const db = require('../db');

const XP_HIT = 1;
const XP_TRAIN = 10;
const XP_WORK = 10;
const XP_ROUND_MEDAL = 20;
const XP_BATTLE_HERO_MEDAL = 100;
const XP_CONGRESS = 300;
const XP_PRESIDENT = 2000;
const XP_JOURNALIST_MILESTONE = 50;
const XP_BUG_REPORT = 50;
const XP_REFERRAL_BONUS = 20;

const REFERRAL_LEVEL_THRESHOLD = 5;
const REFERRAL_GOLD_BONUS = 10;

function levelForXp(xp) {
  const n = (25 + Math.sqrt(625 + 100 * xp)) / 50;
  return Math.max(1, Math.floor(n + 1e-9));
}

// Adds XP to a user, updates their cached level, and pays out the referral
// bonus the first time they cross the referral level threshold.
function awardXp(userId, amount) {
  const user = db.prepare('SELECT xp, level, referred_by_user_id FROM users WHERE id = ?').get(userId);
  if (!user) return;

  const newXp = user.xp + amount;
  const newLevel = levelForXp(newXp);

  db.prepare('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(newXp, newLevel, userId);

  const crossedReferralThreshold = user.level < REFERRAL_LEVEL_THRESHOLD && newLevel >= REFERRAL_LEVEL_THRESHOLD;
  if (crossedReferralThreshold && user.referred_by_user_id) {
    db.prepare('UPDATE users SET gold = gold + ? WHERE id = ?').run(REFERRAL_GOLD_BONUS, user.referred_by_user_id);
    awardXpNoReferralCheck(user.referred_by_user_id, XP_REFERRAL_BONUS);
  }
}

// Used internally to avoid re-triggering referral checks recursively.
function awardXpNoReferralCheck(userId, amount) {
  const user = db.prepare('SELECT xp FROM users WHERE id = ?').get(userId);
  if (!user) return;
  const newXp = user.xp + amount;
  db.prepare('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(newXp, levelForXp(newXp), userId);
}

module.exports = {
  XP_HIT,
  XP_TRAIN,
  XP_WORK,
  XP_ROUND_MEDAL,
  XP_BATTLE_HERO_MEDAL,
  XP_CONGRESS,
  XP_PRESIDENT,
  XP_JOURNALIST_MILESTONE,
  XP_BUG_REPORT,
  REFERRAL_GOLD_BONUS,
  levelForXp,
  awardXp,
};
