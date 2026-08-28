import { addNotification } from "../helpers/notificationHelper.js";
import { generateNewsFromScandal } from "./newsEngine.js";

/**
 * PR & Scandal Management Engine (issue #281)
 *
 * Handles random scandal events that damage studio reputation, and
 * provides a mechanism for players to run PR campaigns to restore it.
 */

// Scandal definitions with their probabilities and impact
const SCANDAL_TYPES = [
  {
    id: "actor-arrested",
    description: "One of your actors was arrested in a public incident.",
    chance: 0.03,
    reputationImpact: -15,
  },
  {
    id: "director-walkout",
    description: "A director publicly walked off your set, citing creative differences.",
    chance: 0.02,
    reputationImpact: -10,
  },
  {
    id: "financial-scandal",
    description: "Financial irregularities at your studio were leaked to the press.",
    chance: 0.015,
    reputationImpact: -20,
  },
  {
    id: "workplace-complaint",
    description: "A workplace conditions complaint went viral on social media.",
    chance: 0.025,
    reputationImpact: -12,
  },
  {
    id: "plagiarism-accusation",
    description: "Your latest script was accused of plagiarism by an indie filmmaker.",
    chance: 0.02,
    reputationImpact: -8,
  },
];

// PR campaign options available to players
export const PR_CAMPAIGNS = [
  {
    id: "press-conference",
    name: "Press Conference",
    cost: 500000,
    reputationBoost: 10,
    description: "Hold a public press conference to address concerns.",
  },
  {
    id: "charitable-donation",
    name: "Charitable Donation",
    cost: 1000000,
    reputationBoost: 15,
    description: "Make a large charitable donation to restore public image.",
  },
  {
    id: "apology-tour",
    name: "Apology Tour",
    cost: 750000,
    reputationBoost: 20,
    description: "Launch a public apology tour with media appearances.",
  },
  {
    id: "community-outreach",
    name: "Community Outreach Program",
    cost: 1500000,
    reputationBoost: 25,
    description: "Fund a long-term community outreach program.",
  },
];

/**
 * Roll for scandal events each week. Called by the tick engine.
 *
 * @param {object} gameState - GameState document
 * @param {object} studio - Studio document
 * @returns {Array} list of scandal events that fired
 */
export const processScandals = async (gameState, studio) => {
  const firedScandals = [];
  const currentWeek = gameState.currentWeek || 0;

  for (const scandal of SCANDAL_TYPES) {
    if (Math.random() < scandal.chance) {
      // Apply reputation damage
      const oldReputation = Number(studio.reputation ?? 100);
      studio.reputation = Math.max(0, oldReputation + scandal.reputationImpact);

      // Track active scandal
      if (!studio.activeScandals) studio.activeScandals = [];
      studio.activeScandals.push({
        description: scandal.description,
        week: currentWeek,
        reputationImpact: scandal.reputationImpact,
      });

      addNotification(
        gameState,
        `SCANDAL: ${scandal.description} Reputation dropped to ${studio.reputation}.`
      );

      await generateNewsFromScandal(scandal, studio, currentWeek);

      firedScandals.push(scandal);

      // Only one scandal per week
      break;
    }
  }

  // Natural reputation recovery: +1 per week if no scandal fired
  if (firedScandals.length === 0 && (studio.reputation ?? 100) < 100) {
    studio.reputation = Math.min(100, Number(studio.reputation ?? 100) + 1);
  }

  return firedScandals;
};

/**
 * Apply reputation effects to ticket sales.
 * Returns a multiplier (0.5 to 1.0) based on reputation.
 *
 * @param {object} studio - Studio document
 * @returns {number} multiplier for ticket sales
 */
export const getReputationMultiplier = (studio) => {
  const reputation = Number(studio.reputation ?? 100);
  if (reputation >= 80) return 1.0;
  if (reputation >= 60) return 0.9;
  if (reputation >= 40) return 0.8;
  if (reputation >= 20) return 0.7;
  return 0.5;
};
