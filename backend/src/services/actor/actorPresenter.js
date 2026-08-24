import {
  getActorCareerStage,
  calculateActorStardom,
  calculateActorDemand,
  CAREER_STAGE_LABELS,
} from "./actorLifecycleEngine.js";

const DISCOVERY_REVEAL_THRESHOLD = 50;
const HIDDEN_STAT_VALUE = null;

export const presentActor = (actor) => {
  const presentedActor = actor?.toObject ? actor.toObject() : { ...(actor || {}) };

  const discovered = Number(presentedActor.discovered || 0);
  const statsRevealed = discovered >= DISCOVERY_REVEAL_THRESHOLD;

  presentedActor.statsRevealed = statsRevealed;

  if (!statsRevealed) {
    presentedActor.actingSkill = HIDDEN_STAT_VALUE;
    presentedActor.reliability = HIDDEN_STAT_VALUE;
    presentedActor.fanbase = HIDDEN_STAT_VALUE;
  }

  // Derive career stage, stardom tier, and demand for complete lifecycle representation
  const careerStage = getActorCareerStage(presentedActor);
  const { stardomScore, stardomTier, stardomTierLabel } = calculateActorStardom(presentedActor);
  const demandScore = calculateActorDemand(presentedActor);

  presentedActor.careerStage = careerStage;
  presentedActor.careerStageLabel = CAREER_STAGE_LABELS[careerStage] || careerStage;
  presentedActor.stardomScore = stardomScore;
  presentedActor.stardomTier = stardomTier;
  presentedActor.stardomTierLabel = stardomTierLabel;
  presentedActor.demandScore = demandScore;
  presentedActor.isLegacy = careerStage === "LEGACY";

  return presentedActor;
};

export const presentActors = (actors = []) => actors.map(presentActor);
