import TalentRelationship, {
  RELATIONSHIP_TYPES,
} from "../models/TalentRelationship.js";
import {
  evaluateCastChemistry,
  calculateRelationshipModifiers,
  normalizePair,
} from "../services/simulation/engines/relationshipEngine.js";

/**
 * GET /api/relationships
 * Returns all relationships for the current player's talent universe.
 */
export const getTalentRelationships = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, talentId } = req.query;

    const query = { userId };
    if (type) query.type = type;
    if (talentId) {
      query.$or = [{ talentAId: talentId }, { talentBId: talentId }];
    }

    const relationships = await TalentRelationship.find(query)
      .sort({ strength: -1, updatedAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: relationships.length,
      relationships,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/relationships/cast-chemistry
 * Evaluates the net chemistry bonuses and conflicts for a candidate cast.
 */
export const evaluateCandidateCastChemistry = async (req, res) => {
  try {
    const userId = req.user._id;
    const { leadActorId, supportingActorIds } = req.body;

    if (!leadActorId) {
      return res.status(400).json({ success: false, message: "leadActorId is required" });
    }

    const result = await evaluateCastChemistry(userId, leadActorId, supportingActorIds || []);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/relationships
 * Manually creates or seeds a talent relationship (e.g., via PR interaction or matchmaking).
 */
export const createOrUpdateRelationship = async (req, res) => {
  try {
    const userId = req.user._id;
    const { talentAId, talentBId, talentAName, talentBName, type, strength } = req.body;

    if (!talentAId || !talentBId) {
      return res.status(400).json({ success: false, message: "Both talent IDs are required." });
    }

    const pair = normalizePair(talentAId, talentBId, talentAName, talentBName);
    const relType = Object.values(RELATIONSHIP_TYPES).includes(type) ? type : RELATIONSHIP_TYPES.NEUTRAL;
    const relStrength = Math.max(0, Math.min(100, Number(strength) || 50));
    const mods = calculateRelationshipModifiers(relType, relStrength);

    let rel = await TalentRelationship.findOne({
      userId,
      talentAId: pair.talentAId,
      talentBId: pair.talentBId,
    });

    if (rel) {
      rel.type = relType;
      rel.strength = relStrength;
      rel.chemistryModifier = mods.chemistryModifier;
      rel.audienceInterestModifier = mods.audienceInterestModifier;
      rel.history.push({
        week: req.body.week || 1,
        event: "UPDATED",
        details: `Relationship adjusted to ${relType} (Strength: ${relStrength})`,
        delta: 0,
      });
    } else {
      rel = new TalentRelationship({
        userId,
        talentAId: pair.talentAId,
        talentBId: pair.talentBId,
        talentAName: pair.talentAName,
        talentBName: pair.talentBName,
        type: relType,
        strength: relStrength,
        chemistryModifier: mods.chemistryModifier,
        audienceInterestModifier: mods.audienceInterestModifier,
        history: [
          {
            week: req.body.week || 1,
            event: "CREATED",
            details: `Relationship established as ${relType}`,
            delta: relStrength,
          },
        ],
      });
    }

    await rel.save();
    return res.status(200).json({ success: true, relationship: rel });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
