/**
 * @fileoverview Celebrity Scandal & Reputation Recovery Engine
 * Implements persistent scandal generation, media escalation, social amplification,
 * box office revenue penalties, and PR/legal recovery mechanics.
 */

export const SCANDAL_TYPES = {
  DRUG_USE: {
    baseSeverity: "MEDIUM",
    baseOutrage: 45,
    popularityPenalty: 20,
    boxOfficePenalty: 15,
    baseDrain: 4,
  },
  AFFAIR: {
    baseSeverity: "LOW",
    baseOutrage: 35,
    popularityPenalty: 12,
    boxOfficePenalty: 8,
    baseDrain: 2,
  },
  ASSAULT_ALLEGATION: {
    baseSeverity: "CRITICAL",
    baseOutrage: 85,
    popularityPenalty: 45,
    boxOfficePenalty: 40,
    baseDrain: 12,
  },
  POLITICAL_CONTROVERSY: {
    baseSeverity: "MEDIUM",
    baseOutrage: 50,
    popularityPenalty: 25,
    boxOfficePenalty: 20,
    baseDrain: 5,
  },
  TAX_FRAUD: {
    baseSeverity: "HIGH",
    baseOutrage: 65,
    popularityPenalty: 30,
    boxOfficePenalty: 25,
    baseDrain: 8,
  },
  LEAKED_VIDEOS: {
    baseSeverity: "HIGH",
    baseOutrage: 60,
    popularityPenalty: 28,
    boxOfficePenalty: 22,
    baseDrain: 6,
  },
};

export const PR_STRATEGIES = {
  PUBLIC_APOLOGY: {
    name: "Public Apology & Press Tour",
    cost: 50000,
    outrageReduction: 30,
    recoveryBoost: 20,
    riskStreisand: 0.1,
  },
  CHARITY_DONATION: {
    name: "Charity Foundation Donation",
    cost: 150000,
    outrageReduction: 40,
    recoveryBoost: 35,
    riskStreisand: 0.05,
  },
  DEFAMATION_LAWSUIT: {
    name: "File Aggressive Defamation Lawsuit",
    cost: 250000,
    outrageReduction: 50,
    recoveryBoost: 40,
    debunkChance: 0.65,
    riskStreisand: 0.35,
  },
  PRESS_CONFERENCE: {
    name: "Controlled Studio Press Briefing",
    cost: 75000,
    outrageReduction: 25,
    recoveryBoost: 15,
    riskStreisand: 0.15,
  },
  STUDIO_TERMINATION: {
    name: "Public Contract Termination & Distance",
    cost: 20000,
    outrageReduction: 60,
    recoveryBoost: 50,
    studioDrainStop: true,
    riskStreisand: 0.0,
  },
  CRISIS_SETTLEMENT: {
    name: "Confidential Financial Settlement & NDA",
    cost: 500000,
    outrageReduction: 75,
    recoveryBoost: 70,
    instantContainment: true,
    riskStreisand: 0.05,
  },
};

/**
 * Calculates probability of a talent triggering a scandal in a given week
 * @param {Object} talent
 * @param {Object} studio
 * @returns {number} Probability between 0.01 and 0.25
 */
export function calculateScandalProbability(talent, studio = {}) {
  let prob = 0.03; // 3% base weekly chance per talent
  const popularity = talent.popularity || talent.fame || 50;

  // Higher fame attracts intense media scrutiny
  if (popularity > 80) prob += 0.04;
  else if (popularity > 60) prob += 0.02;

  // Studio pressure or low morale increases vulnerability
  if (studio.reputation && studio.reputation < 40) prob += 0.03;

  return Math.min(0.25, Math.max(0.01, Number(prob.toFixed(3))));
}

/**
 * Evaluates the impact of a PR / Legal strategy on an active scandal
 * @param {Object} scandal
 * @param {string} strategyKey
 * @param {number} studioCash
 * @returns {Object} Resolution outcome
 */
export function evaluatePRStrategy(scandal, strategyKey, studioCash = Infinity) {
  const strategy = PR_STRATEGIES[strategyKey];
  if (!strategy) {
    throw new Error(`Invalid PR Strategy: ${strategyKey}`);
  }

  if (studioCash < strategy.cost) {
    return {
      success: false,
      reason: "INSUFFICIENT_FUNDS",
      cost: strategy.cost,
    };
  }

  let finalOutrage = scandal.publicOutrage;
  let newStatus = scandal.status;
  let newEvidence = scandal.evidenceStatus;
  let message = "";
  let isStreisand = Math.random() < strategy.riskStreisand;

  if (isStreisand) {
    // Backfire effect: increased scrutiny
    finalOutrage = Math.min(100, finalOutrage + 15);
    message = `PR strategy backfired! Media exposure intensified for ${scandal.talentName}.`;
  } else {
    // Standard mitigation
    finalOutrage = Math.max(0, finalOutrage - strategy.outrageReduction);
    message = `Successfully deployed ${strategy.name}. Public outrage decreased by ${strategy.outrageReduction}%.`;
  }

  // Handle Defamation Lawsuit outcome
  if (strategyKey === "DEFAMATION_LAWSUIT" && !isStreisand) {
    if (Math.random() < strategy.debunkChance) {
      newEvidence = "DEBUNKED";
      newStatus = "RESOLVED";
      finalOutrage = 5;
      message = `Lawsuit proved the scandal against ${scandal.talentName} was completely fabricated! Full vindication.`;
    }
  }

  // Handle Settlement
  if (strategy.instantContainment) {
    newStatus = "CONTAINED";
    finalOutrage = Math.min(finalOutrage, 20);
    message = `Confidential settlement executed. Story suppressed from major headlines.`;
  }

  if (strategy.studioDrainStop) {
    newStatus = "RESOLVED";
    message = `Studio parted ways with ${scandal.talentName}. Studio reputation protected.`;
  }

  const recoveryProgress = Math.min(
    100,
    scandal.recoveryProgress + strategy.recoveryBoost
  );

  return {
    success: true,
    cost: strategy.cost,
    chosenPRStrategy: strategyKey,
    publicOutrage: finalOutrage,
    status: newStatus,
    evidenceStatus: newEvidence,
    recoveryProgress,
    message,
    boxOfficeImpactPercent: Math.max(
      0,
      Math.round(scandal.boxOfficeImpactPercent * (finalOutrage / 100))
    ),
    reputationDrainPerWeek: Math.max(
      0,
      Math.round(scandal.reputationDrainPerWeek * (finalOutrage / 100))
    ),
  };
}

/**
 * Calculates box office penalty multiplier for a movie with involved scandal talent
 * @param {Object} movie
 * @param {Array} activeScandals
 * @returns {number} Multiplier between 0.25 (heavy penalty) and 1.0 (no penalty)
 */
export function calculateMovieBoxOfficeModifier(movie, activeScandals = []) {
  if (!activeScandals || activeScandals.length === 0) return 1.0;

  const talentIds = [
    ...(movie.cast || []).map((c) => String(c.actorId || c._id || c)),
    String(movie.directorId || ""),
    String(movie.writerId || ""),
  ].filter(Boolean);

  let totalPenalty = 0;
  for (const sc of activeScandals) {
    if (sc.status === "ACTIVE" && talentIds.includes(String(sc.talentId))) {
      totalPenalty += sc.boxOfficeImpactPercent || 10;
    }
  }

  // Cap penalty at 70% reduction
  totalPenalty = Math.min(70, totalPenalty);
  return Number((1 - totalPenalty / 100).toFixed(2));
}

/**
 * Processes weekly tick for all studio scandals
 * @param {Array} scandals
 * @param {number} currentWeek
 * @returns {Object} Processed scandals and cumulative studio reputation drain
 */
export function processWeeklyScandals(scandals = [], currentWeek = 1) {
  let totalReputationDrain = 0;
  const updatedScandals = [];

  for (const scandal of scandals) {
    if (scandal.status === "RECOVERED") {
      updatedScandals.push(scandal);
      continue;
    }

    const updated = { ...scandal };
    updated.weeksActive = (updated.weeksActive || 0) + 1;

    if (updated.status === "ACTIVE") {
      // Drains reputation and escalates outrage if unaddressed
      totalReputationDrain += updated.reputationDrainPerWeek || 2;

      // Natural media decay or persistence
      if (updated.weeksActive > 4) {
        updated.publicOutrage = Math.max(
          10,
          updated.publicOutrage - 5
        );
        updated.recoveryProgress = Math.min(
          100,
          (updated.recoveryProgress || 0) + 10
        );
      }
    } else if (updated.status === "CONTAINED" || updated.status === "RESOLVED") {
      // Rapid recovery
      updated.publicOutrage = Math.max(0, updated.publicOutrage - 15);
      updated.recoveryProgress = Math.min(
        100,
        (updated.recoveryProgress || 0) + 25
      );
    }

    if (updated.recoveryProgress >= 100) {
      updated.status = "RECOVERED";
      updated.publicOutrage = 0;
      updated.boxOfficeImpactPercent = 0;
      updated.reputationDrainPerWeek = 0;
    }

    updatedScandals.push(updated);
  }

  return {
    updatedScandals,
    totalReputationDrain,
  };
}
