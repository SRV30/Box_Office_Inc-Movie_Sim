/**
 * @fileoverview Actor Lifecycle Engine
 *
 * Provides comprehensive career progression, stardom calculations, dynamic
 * salary & demand tracking, organic aging & skill development, and retirement
 * management for actors.
 *
 * Implements Issue #521: Complete actor lifecycle with aging, retirement,
 * careers, and stardom.
 */

export const CAREER_STAGES = {
  EMERGING: "EMERGING",
  ESTABLISHED: "ESTABLISHED",
  VETERAN: "VETERAN",
  LEGACY: "LEGACY",
};

export const STARDOM_TIERS = {
  LOCAL_TALENT: "LOCAL_TALENT",
  RISING_STAR: "RISING_STAR",
  A_LIST: "A_LIST",
  SUPERSTAR: "SUPERSTAR",
  ICON: "ICON",
};

export const STARDOM_TIER_LABELS = {
  [STARDOM_TIERS.LOCAL_TALENT]: "Local Talent",
  [STARDOM_TIERS.RISING_STAR]: "Rising Star",
  [STARDOM_TIERS.A_LIST]: "A-List Star",
  [STARDOM_TIERS.SUPERSTAR]: "Global Superstar",
  [STARDOM_TIERS.ICON]: "Cinematic Icon",
};

export const CAREER_STAGE_LABELS = {
  [CAREER_STAGES.EMERGING]: "Emerging Talent",
  [CAREER_STAGES.ESTABLISHED]: "Established Performer",
  [CAREER_STAGES.VETERAN]: "Veteran Actor",
  [CAREER_STAGES.LEGACY]: "Living Legend",
};

/**
 * Derives the consistent career stage of an actor based on age, movie credits,
 * hit record, awards, and box office accomplishments.
 *
 * @param {object} actor - Actor profile.
 * @returns {string} One of CAREER_STAGES enum values.
 */
export const getActorCareerStage = (actor = {}) => {
  const age = Number(actor.age || 20);
  const movies = Number(actor.movies || 0);
  const hits = Number(actor.hitMovies || 0);
  const awards = Number(actor.awards || 0);
  const boxOffice = Number(actor.boxOfficeTotal || 0);
  const popularity = Number(actor.popularity || 0);

  // Legacy qualification: exceptional achievements or legendary senior career
  const isLegacy =
    (awards >= 2 && hits >= 4 && boxOffice >= 200000000) ||
    (awards >= 3 && movies >= 6) ||
    (hits >= 8 && boxOffice >= 400000000) ||
    (age >= 62 && movies >= 10 && (popularity >= 60 || awards >= 1));

  if (isLegacy) {
    return CAREER_STAGES.LEGACY;
  }

  // Veteran qualification: deep experience or older age with established work
  if (movies >= 12 || (age >= 55 && movies >= 5) || (movies >= 8 && popularity >= 70)) {
    return CAREER_STAGES.VETERAN;
  }

  // Established qualification: proven track record
  if (movies >= 3 || (age >= 28 && popularity >= 40) || hits >= 2) {
    return CAREER_STAGES.ESTABLISHED;
  }

  // Otherwise emerging
  return CAREER_STAGES.EMERGING;
};

/**
 * Calculates stardom score (0 - 100) and assigns the corresponding stardom tier.
 *
 * @param {object} actor - Actor profile.
 * @returns {{ stardomScore: number, stardomTier: string, stardomTierLabel: string }}
 */
export const calculateActorStardom = (actor = {}) => {
  const popularity = Number(actor.popularity || 0);
  const fanbase = Number(actor.fanbase || 0);
  const movies = Number(actor.movies || 0);
  const hits = Number(actor.hitMovies || 0);
  const awards = Number(actor.awards || 0);
  const boxOffice = Number(actor.boxOfficeTotal || 0);

  // Normalized fanbase component (caps around 2,000,000 fans)
  const fanbaseScore = Math.min(100, Math.round((fanbase / 2000000) * 100));

  // Hit ratio component
  const hitRatio = movies > 0 ? hits / movies : 0;
  const hitScore = Math.min(100, Math.round(hitRatio * 60 + Math.min(40, hits * 8)));

  // Awards & Box office prestige score
  const prestigeScore = Math.min(100, Math.round(awards * 20 + Math.min(40, (boxOffice / 500000000) * 40)));

  // Weighted composite stardom score
  const composite =
    popularity * 0.35 +
    fanbaseScore * 0.25 +
    hitScore * 0.2 +
    prestigeScore * 0.2;

  const stardomScore = Math.max(0, Math.min(100, Math.round(composite)));

  let stardomTier = STARDOM_TIERS.LOCAL_TALENT;
  if (stardomScore >= 85) stardomTier = STARDOM_TIERS.ICON;
  else if (stardomScore >= 70) stardomTier = STARDOM_TIERS.SUPERSTAR;
  else if (stardomScore >= 50) stardomTier = STARDOM_TIERS.A_LIST;
  else if (stardomScore >= 25) stardomTier = STARDOM_TIERS.RISING_STAR;

  return {
    stardomScore,
    stardomTier,
    stardomTierLabel: STARDOM_TIER_LABELS[stardomTier],
  };
};

/**
 * Calculates current market demand multiplier for the actor (0.5x to 2.5x).
 *
 * @param {object} actor - Actor profile.
 * @returns {number} Demand score rounded to 2 decimal places.
 */
export const calculateActorDemand = (actor = {}) => {
  const popularity = Number(actor.popularity || 0);
  const hits = Number(actor.hitMovies || 0);
  const flops = Number(actor.flopMovies || 0);
  const awards = Number(actor.awards || 0);
  const stage = getActorCareerStage(actor);

  let demand = 1.0;

  // Popularity impact
  demand += (popularity - 50) * 0.01;

  // Hit momentum vs flop drag
  demand += hits * 0.05 - flops * 0.04;

  // Awards prestige bonus
  demand += awards * 0.1;

  // Career stage premium
  if (stage === CAREER_STAGES.LEGACY) demand += 0.25;
  else if (stage === CAREER_STAGES.VETERAN) demand += 0.15;
  else if (stage === CAREER_STAGES.ESTABLISHED) demand += 0.05;

  return Math.max(0.5, Math.min(2.5, Number(demand.toFixed(2))));
};

/**
 * Computes updated salary based on base talent metrics, demand, and stardom.
 *
 * @param {object} actor - Actor profile.
 * @returns {number} Recommended weekly salary in ₹.
 */
export const calculateDynamicSalary = (actor = {}) => {
  const baseSalary = Number(actor.salary || 50000);
  const demand = calculateActorDemand(actor);
  const { stardomScore } = calculateActorStardom(actor);

  const stardomMultiplier = 0.8 + (stardomScore / 100) * 0.6;
  const targetSalary = Math.round(baseSalary * demand * stardomMultiplier);

  return Math.max(15000, targetSalary);
};

/**
 * Calculates natural skill development and age progression for an actor during yearly tick.
 *
 * @param {object} actor - Actor profile.
 * @returns {object} Mutated actor with updated stats.
 */
export const evolveActorStats = (actor = {}) => {
  const age = Number(actor.age || 20);
  const hiddenPotential = Number(actor.hiddenPotential || 50);
  let actingSkill = Number(actor.actingSkill || 50);
  let reliability = Number(actor.reliability || 50);
  let popularity = Number(actor.popularity || 50);
  let fanbase = Number(actor.fanbase || 10000);

  // Younger emerging actors develop acting skill toward hidden potential
  if (age < 35 && actingSkill < hiddenPotential) {
    const growth = Math.floor(Math.random() * 3) + 1;
    actingSkill = Math.min(100, actingSkill + growth);
  }

  // Prime actors hone reliability
  if (age >= 28 && age <= 50 && reliability < 90) {
    const reliabilityGrowth = Math.floor(Math.random() * 2) + 1;
    reliability = Math.min(100, reliability + reliabilityGrowth);
  }

  // Inactive senior actors experience slight organic popularity decay without hits
  if (age > 60 && Number(actor.movies || 0) === 0) {
    popularity = Math.max(10, popularity - 1);
    fanbase = Math.max(1000, Math.round(fanbase * 0.96));
  }

  actor.actingSkill = actingSkill;
  actor.reliability = reliability;
  actor.popularity = popularity;
  actor.fanbase = fanbase;

  return actor;
};

/**
 * Determines whether an actor should retire at their current age.
 *
 * @param {object} actor - Actor profile.
 * @returns {boolean} Whether the actor elects to retire.
 */
export const shouldActorRetire = (actor = {}) => {
  const age = Number(actor.age || 0);

  if (age < 60) return false;
  if (age >= 72) return true;

  // Scaled probabilistic retirement from 60 to 71
  const retirementProb = Math.min(0.95, 0.1 + ((age - 60) / 12) * 0.85);
  return Math.random() < retirementProb;
};
