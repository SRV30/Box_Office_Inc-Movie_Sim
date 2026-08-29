/**
 * @fileoverview Complete V2 Franchise, Canon, Fatigue & Universe Economy Engine
 * Implements canon timeline validation, cross-media synergies, fatigue accumulation and decay,
 * crossover box office scaling, and autonomous AI expansion algorithms.
 */

/**
 * Validates canon consistency across the universe timeline
 * @param {Array} timeline
 * @returns {{ loreScore: number, violations: Array<string> }}
 */
export function validateCanonConsistency(timeline = []) {
  if (!timeline || timeline.length === 0) {
    return { loreScore: 100, violations: [] };
  }

  let loreScore = 100;
  const violations = [];

  // Check chronological timeline continuity
  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1];
    const curr = timeline[i];

    // Check for inconsistent narrative sequencing
    if (curr.narrativeType === "ORIGIN" && i > 1) {
      loreScore -= 8;
      violations.push(`Late-phase origin story (${curr.title}) disrupted established canon.`);
    }

    // Writer continuity check
    if (!curr.leadWriterRetained) {
      loreScore -= 10;
      violations.push(`Creative leadership departure on ${curr.title} resulted in plot retcons.`);
    }
  }

  loreScore = Math.max(15, Math.min(100, loreScore));
  return {
    loreScore,
    violations,
  };
}

/**
 * Calculates fatigue score based on release frequency and hiatuses
 * @param {number} currentWeek
 * @param {Array} timeline
 * @param {boolean} inHiatus
 * @returns {{ fatigueScore: number, fatiguePenaltyPercent: number }}
 */
export function calculateFranchiseFatigue(currentWeek, timeline = [], inHiatus = false) {
  if (!timeline || timeline.length === 0) {
    return { fatigueScore: 0, fatiguePenaltyPercent: 0 };
  }

  // Count releases in the last 26 weeks
  const recentReleases = timeline.filter(
    (entry) => currentWeek - (entry.releaseWeek || 0) <= 26
  ).length;

  let fatigueScore = 0;
  if (recentReleases > 2) {
    fatigueScore = (recentReleases - 2) * 22;
  }

  if (inHiatus) {
    fatigueScore = Math.max(0, fatigueScore - 40);
  }

  fatigueScore = Math.max(0, Math.min(100, fatigueScore));
  const fatiguePenaltyPercent = Number((fatigueScore * 0.45).toFixed(1));

  return {
    fatigueScore,
    fatiguePenaltyPercent,
  };
}

/**
 * Calculates universe box office synergy and box office multiplier
 * @param {Object} universe
 * @param {Object} entry
 * @returns {number} Box office revenue multiplier (e.g. 1.0 - 2.5)
 */
export function calculateUniverseBoxOfficeModifier(universe = {}, entry = {}) {
  const loreConsistency = universe.loreConsistencyScore || 90;
  const loreMultiplier = loreConsistency / 100;

  const fanbaseBonus = Math.min(0.6, (universe.fanbaseSize || 1000000) / 10000000);
  const prestigeBonus = ((universe.prestigeLevel || 20) / 100) * 0.25;

  let crossoverMultiplier = 1.0;
  if (entry.narrativeType === "CROSSOVER_EVENT") {
    const priorEntriesCount = (universe.canonTimeline || []).length;
    crossoverMultiplier = 1.0 + Math.min(0.75, priorEntriesCount * 0.12);
  }

  const fatigueDeduction = (universe.fatigueScore || 0) * 0.005;

  let totalMultiplier =
    (1.0 + fanbaseBonus + prestigeBonus) * crossoverMultiplier * loreMultiplier -
    fatigueDeduction;

  return Math.max(0.65, Number(totalMultiplier.toFixed(2)));
}

/**
 * Calculates cross-media synergy between active movies and airing TV shows
 * @param {Array} universeEntries
 * @returns {{ crossMediaBonusPercent: number, hasSynergy: boolean }}
 */
export function evaluateCrossMediaSynergy(universeEntries = []) {
  const hasMovies = universeEntries.some((e) => e.entryType === "MOVIE");
  const hasTV = universeEntries.some((e) => e.entryType === "TV_SHOW");

  if (hasMovies && hasTV) {
    return {
      crossMediaBonusPercent: 18,
      hasSynergy: true,
    };
  }

  return {
    crossMediaBonusPercent: 0,
    hasSynergy: false,
  };
}

/**
 * Evaluates whether an AI studio should greenlight a new universe entry
 * @param {Object} universe
 * @param {number} currentWeek
 * @returns {{ shouldExpand: boolean, recommendedType: string }}
 */
export function evaluateAIFranchiseExpansion(universe = {}, currentWeek = 1) {
  const fatigue = calculateFranchiseFatigue(currentWeek, universe.canonTimeline || [], universe.inHiatus);

  // If audience is fatigued, enforce hiatus
  if (fatigue.fatigueScore > 40) {
    return { shouldExpand: false, recommendedType: "HIATUS" };
  }

  const entriesCount = (universe.canonTimeline || []).length;

  if (entriesCount === 0) {
    return { shouldExpand: true, recommendedType: "ORIGIN" };
  } else if (entriesCount === 2 || entriesCount === 5) {
    return { shouldExpand: true, recommendedType: "CROSSOVER_EVENT" };
  } else if (entriesCount >= 3) {
    return { shouldExpand: true, recommendedType: "SPIN_OFF" };
  }

  return { shouldExpand: true, recommendedType: "SEQUEL" };
}
