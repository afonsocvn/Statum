// Combat numbers are assumptions, adjustable — see docs/decisions.md.

const MAX_HP = 100;
const HP_PER_HIT = 10;
const FOOD_HP_RESTORE = 20;

const BASE_HIT_DAMAGE = 10;
const MISS_CHANCE = 0.10;
const CRIT_CHANCE = 0.15;
const CRIT_MULTIPLIER = 2;
const WEAPON_BONUS_PER_QUALITY = 0.25;

const TERRAIN_BONUS = {
  naval: 0.30,
  mountainous: 0.30,
  desert: 0.30,
  terrestrial: 0.10,
};

const SKILLS = ['naval', 'mountainous', 'terrestrial', 'desert'];

const RANKS = [
  { name: 'Recruit', threshold: 0, bonus: 0 },
  { name: 'Private', threshold: 200, bonus: 0.02 },
  { name: 'Corporal', threshold: 1000, bonus: 0.04 },
  { name: 'Sergeant', threshold: 5000, bonus: 0.06 },
  { name: 'Lieutenant', threshold: 15000, bonus: 0.08 },
  { name: 'Captain', threshold: 40000, bonus: 0.10 },
  { name: 'Major', threshold: 100000, bonus: 0.12 },
];

function getRank(totalDamage) {
  let rank = RANKS[0];
  for (const candidate of RANKS) {
    if (totalDamage >= candidate.threshold) rank = candidate;
  }
  return rank;
}

function bestSkillMultiplier(skills, terrain) {
  const tags = terrain.split(';').map((t) => t.trim()).filter(Boolean);
  let best = 0;
  for (const tag of tags) {
    if (!SKILLS.includes(tag)) continue;
    const value = skills[tag] || 0;
    const bonus = TERRAIN_BONUS[tag] || 0;
    const contribution = value * (1 + bonus);
    if (contribution > best) best = contribution;
  }
  return best;
}

// Returns { damage, isMiss, isCrit }. weaponQuality is null for unarmed hits.
function resolveHit({ skills, terrain, weaponQuality, totalDamage }) {
  if (Math.random() < MISS_CHANCE) {
    return { damage: 0, isMiss: true, isCrit: false };
  }

  const skillContribution = bestSkillMultiplier(skills, terrain);
  let damage = BASE_HIT_DAMAGE + skillContribution;

  if (weaponQuality) {
    damage *= 1 + WEAPON_BONUS_PER_QUALITY * weaponQuality;
  }

  const rank = getRank(totalDamage);
  damage *= 1 + rank.bonus;

  const isCrit = Math.random() < CRIT_CHANCE;
  if (isCrit) damage *= CRIT_MULTIPLIER;

  return { damage: Math.round(damage), isMiss: false, isCrit };
}

module.exports = {
  MAX_HP,
  HP_PER_HIT,
  FOOD_HP_RESTORE,
  BASE_HIT_DAMAGE,
  MISS_CHANCE,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  WEAPON_BONUS_PER_QUALITY,
  TERRAIN_BONUS,
  RANKS,
  getRank,
  resolveHit,
};
