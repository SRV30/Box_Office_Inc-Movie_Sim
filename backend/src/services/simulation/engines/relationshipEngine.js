/**
 * @fileoverview Talent Chemistry & Relationship Engine
 *
 * Simulates persistent actor relationships:
 *  - Friendships (+Chemistry, +Morale stability)
 *  - Rivalries (-Chemistry, risk of production conflict/delays, high audience drama)
 *  - Mentorships (+Young actor progression, +Quality)
 *  - Romantic relationships (+Huge audience hype & chemistry, fragile)
 *  - Breakups (-Chemistry, production friction, public gossip)
 *
 * Evaluates:
 *  - Casting chemistry modifiers
 *  - Production conflict events
 *  - Audience interest / box office modifiers
 *  - Weekly natural decay and dynamic formation
 */

import TalentRelationship, { RELATIONSHIP_TYPES } from "../../../models/TalentRelationship.js";
import { addNotification } from "../helpers/notificationHelper.js";
import { generateNewsFromEvent, generateNewsFromRelationship } from "./newsEngine.js";

/**
 * Normalizes ID pair to ensure talentAId < talentBId for deterministic indexing.
 */
export const normalizePair = (idA, idB, nameA = "", nameB = "") => {
  if (String(idA) < String(idB)) {
    return {
      talentAId: String(idA),
      talentBId: String(idB),
      talentAName: nameA,
      talentBName: nameB,
    };
  }
  return {
    talentAId: String(idB),
    talentBId: String(idA),
    talentAName: nameB,
    talentBName: nameA,
  };
};

/**
 * Calculates chemistry and audience modifiers given relationship type and strength.
 */
export const calculateRelationshipModifiers = (type, strength = 50) => {
  const normStrength = Math.max(0, Math.min(100, strength));
  let chemistry = 0;
  let audienceInterest = 0;

  switch (type) {
    case RELATIONSHIP_TYPES.FRIENDSHIP:
      // +5% to +15% chemistry boost
      chemistry = 5 + (normStrength / 100) * 10;
      audienceInterest = 0.05 + (normStrength / 100) * 0.05;
      break;

    case RELATIONSHIP_TYPES.ROMANTIC:
      // High chemistry (+12% to +22%), very high audience interest (+0.1 to +0.25)
      chemistry = 10 + (normStrength / 100) * 12;
      audienceInterest = 0.1 + (normStrength / 100) * 0.15;
      break;

    case RELATIONSHIP_TYPES.MENTORSHIP:
      // +8% to +18% chemistry boost, solid audience respect (+0.05)
      chemistry = 8 + (normStrength / 100) * 10;
      audienceInterest = 0.05;
      break;

    case RELATIONSHIP_TYPES.RIVALRY:
      // -10% to -20% chemistry friction, but spice adds audience intrigue (+0.08)
      chemistry = -5 - (normStrength / 100) * 15;
      audienceInterest = 0.08;
      break;

    case RELATIONSHIP_TYPES.BREAKUP:
      // High friction (-15% to -25%), gossip audience bump (+0.12)
      chemistry = -10 - (normStrength / 100) * 15;
      audienceInterest = 0.12;
      break;

    case RELATIONSHIP_TYPES.NEUTRAL:
    default:
      chemistry = 0;
      audienceInterest = 0;
      break;
  }

  return {
    chemistryModifier: Number(chemistry.toFixed(2)),
    audienceInterestModifier: Number(audienceInterest.toFixed(2)),
  };
};

/**
 * Evaluates full cast chemistry for a movie given lead and supporting actors.
 */
export const evaluateCastChemistry = async (userId, leadActorId, supportingActorIds = []) => {
  const actorIds = [leadActorId, ...supportingActorIds].filter(Boolean);
  if (actorIds.length < 2) {
    return {
      netChemistryBonus: 0,
      netAudienceBonus: 0,
      conflicts: [],
      synergies: [],
      relationships: [],
    };
  }

  const relationships = await TalentRelationship.find({
    userId,
    $or: [
      { talentAId: { $in: actorIds }, talentBId: { $in: actorIds } },
    ],
  }).lean();

  let totalChemistry = 0;
  let totalAudience = 0;
  const conflicts = [];
  const synergies = [];

  for (const rel of relationships) {
    // Only count pairs where BOTH actors are actually in this cast
    if (actorIds.includes(rel.talentAId) && actorIds.includes(rel.talentBId)) {
      totalChemistry += rel.chemistryModifier || 0;
      totalAudience += rel.audienceInterestModifier || 0;

      if (rel.chemistryModifier < 0) {
        conflicts.push({
          talentA: rel.talentAName || rel.talentAId,
          talentB: rel.talentBName || rel.talentBId,
          type: rel.type,
          penalty: rel.chemistryModifier,
        });
      } else if (rel.chemistryModifier > 0) {
        synergies.push({
          talentA: rel.talentAName || rel.talentAId,
          talentB: rel.talentBName || rel.talentBId,
          type: rel.type,
          bonus: rel.chemistryModifier,
        });
      }
    }
  }

  // Cap cast chemistry between -25% and +35%
  const netChemistryBonus = Math.max(-25, Math.min(35, Number(totalChemistry.toFixed(2))));
  const netAudienceBonus = Math.max(-0.15, Math.min(0.35, Number(totalAudience.toFixed(2))));

  return {
    netChemistryBonus,
    netAudienceBonus,
    conflicts,
    synergies,
    relationships,
  };
};

/**
 * Evaluates production friction or breakthrough events caused by cast dynamics.
 */
export const processProductionCastDynamics = async (movie, gameState, studio) => {
  if (!movie || !gameState) return null;

  const actorIds = [movie.leadActorId, ...(movie.supportingActorIds || [])].filter(Boolean);
  if (actorIds.length < 2) return null;

  const relationships = await TalentRelationship.find({
    userId: gameState.user,
    talentAId: { $in: actorIds },
    talentBId: { $in: actorIds },
  });

  for (const rel of relationships) {
    if (rel.type === RELATIONSHIP_TYPES.RIVALRY || rel.type === RELATIONSHIP_TYPES.BREAKUP) {
      // Deterministic conflict roll based on week + movie id
      const roll = (movie.weeksInStage * 17 + rel.strength * 7) % 100;
      if (roll < 20) {
        const costPenalty = Math.round(movie.budget * 0.03);
        movie.budget += costPenalty;
        studio.money = Math.max(0, (studio.money || 0) - costPenalty);
        movie.delayWeeks = (movie.delayWeeks || 0) + 1;

        const msg = `On-set friction between ${rel.talentAName || "Lead"} and ${rel.talentBName || "Co-Star"} (${rel.type}) delayed production of "${movie.title}" by 1 week!`;
        addNotification(gameState, msg);
        await generateNewsFromRelationship(rel, msg, gameState.currentWeek, movie, studio);

        rel.history.push({
          week: gameState.currentWeek,
          event: "PRODUCTION_CONFLICT",
          details: `Clashed during production of ${movie.title}`,
          delta: -5,
        });
        if (rel.history.length > 25) rel.history.shift();
        await rel.save();

        return { event: "CONFLICT", message: msg, costPenalty };
      }
    } else if (rel.type === RELATIONSHIP_TYPES.ROMANTIC || rel.type === RELATIONSHIP_TYPES.FRIENDSHIP) {
      const roll = (movie.weeksInStage * 13 + rel.strength * 3) % 100;
      if (roll < 25) {
        const qualityBoost = 3;
        movie.quality = Math.min(100, (movie.quality || 0) + qualityBoost);
        movie.hype = Math.min(100, (movie.hype || 0) + 4);

        const msg = `Incredible on-screen chemistry between ${rel.talentAName || "Stars"} and ${rel.talentBName || "Co-Star"} boosted quality for "${movie.title}"!`;
        addNotification(gameState, msg);

        return { event: "SYNERGY", message: msg, qualityBoost };
      }
    }
  }

  return null;
};

/**
 * Weekly tick for talent relationships: decays inactive ones, evolves co-stars, rolls dynamic events.
 */
export const processWeeklyRelationships = async (userId, currentWeek = 1) => {
  const relationships = await TalentRelationship.find({ userId });
  if (!relationships || relationships.length === 0) return 0;

  let updatedCount = 0;
  for (const rel of relationships) {
    let changed = false;
    const weeksSinceCollab = currentWeek - (rel.lastCollaboratedWeek || 0);

    // Natural decay if not collaborated for > 26 weeks
    if (weeksSinceCollab > 26 && rel.strength > 20) {
      rel.strength = Math.max(20, rel.strength - 1);
      changed = true;
    }

    // Dynamic transition: High strength Romantic may evolve or break up
    if (rel.type === RELATIONSHIP_TYPES.ROMANTIC) {
      if (rel.strength < 25) {
        rel.type = RELATIONSHIP_TYPES.BREAKUP;
        const mods = calculateRelationshipModifiers(rel.type, rel.strength);
        rel.chemistryModifier = mods.chemistryModifier;
        rel.audienceInterestModifier = mods.audienceInterestModifier;
        rel.history.push({
          week: currentWeek,
          event: "BREAKUP",
          details: "Romantic relationship ended in public breakup.",
          delta: -20,
        });
        changed = true;
      }
    } else if (rel.type === RELATIONSHIP_TYPES.RIVALRY) {
      // Rivalries cool down over long periods
      if (weeksSinceCollab > 52 && rel.strength <= 30) {
        rel.type = RELATIONSHIP_TYPES.NEUTRAL;
        const mods = calculateRelationshipModifiers(rel.type, rel.strength);
        rel.chemistryModifier = mods.chemistryModifier;
        rel.audienceInterestModifier = mods.audienceInterestModifier;
        changed = true;
      }
    }

    if (changed) {
      const mods = calculateRelationshipModifiers(rel.type, rel.strength);
      rel.chemistryModifier = mods.chemistryModifier;
      rel.audienceInterestModifier = mods.audienceInterestModifier;
      if (rel.history.length > 25) rel.history.shift();
      await rel.save();
      updatedCount++;
    }
  }

  return updatedCount;
};

/**
 * Records collaboration between co-stars after movie release.
 */
export const recordMovieCollaboration = async (userId, leadActor, supportingActors = [], currentWeek = 1) => {
  const allActors = [leadActor, ...supportingActors].filter((a) => a && a.id);
  if (allActors.length < 2) return [];

  const createdOrUpdated = [];

  for (let i = 0; i < allActors.length; i++) {
    for (let j = i + 1; j < allActors.length; j++) {
      const actor1 = allActors[i];
      const actor2 = allActors[j];
      const pair = normalizePair(actor1.id, actor2.id, actor1.name, actor2.name);

      let rel = await TalentRelationship.findOne({
        userId,
        talentAId: pair.talentAId,
        talentBId: pair.talentBId,
      });

      if (!rel) {
        // Initial formation based on random seed/chemistry
        const initialType = (actor1.name.length + actor2.name.length) % 5 === 0
          ? RELATIONSHIP_TYPES.FRIENDSHIP
          : RELATIONSHIP_TYPES.NEUTRAL;

        const mods = calculateRelationshipModifiers(initialType, 55);
        rel = new TalentRelationship({
          userId,
          talentAId: pair.talentAId,
          talentBId: pair.talentBId,
          talentAName: pair.talentAName,
          talentBName: pair.talentBName,
          type: initialType,
          strength: 55,
          chemistryModifier: mods.chemistryModifier,
          audienceInterestModifier: mods.audienceInterestModifier,
          coStarMoviesCount: 1,
          lastCollaboratedWeek: currentWeek,
          history: [
            {
              week: currentWeek,
              event: "INITIAL_COLLABORATION",
              details: `Co-starred together in a major release.`,
              delta: 10,
            },
          ],
        });
      } else {
        rel.coStarMoviesCount = (rel.coStarMoviesCount || 0) + 1;
        rel.lastCollaboratedWeek = currentWeek;
        rel.strength = Math.min(100, rel.strength + 8);

        // Transition from neutral to friendship if repeated collaboration
        if (rel.type === RELATIONSHIP_TYPES.NEUTRAL && rel.coStarMoviesCount >= 2) {
          rel.type = RELATIONSHIP_TYPES.FRIENDSHIP;
        }

        const mods = calculateRelationshipModifiers(rel.type, rel.strength);
        rel.chemistryModifier = mods.chemistryModifier;
        rel.audienceInterestModifier = mods.audienceInterestModifier;

        rel.history.push({
          week: currentWeek,
          event: "CO_STAR_RELEASE",
          details: `Completed movie collaboration #${rel.coStarMoviesCount}`,
          delta: 8,
        });
        if (rel.history.length > 25) rel.history.shift();
      }

      await rel.save();
      createdOrUpdated.push(rel);
    }
  }

  return createdOrUpdated;
};
