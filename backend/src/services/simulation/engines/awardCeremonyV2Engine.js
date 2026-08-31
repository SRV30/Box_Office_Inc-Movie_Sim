import AwardCeremonyV2 from "../../../models/AwardCeremonyV2.js";
import Movie from "../../../models/Movie.js";
import Studio from "../../../models/Studio.js";
import Notification from "../../../models/Notification.js";
import PastAward from "../../../models/PastAward.js";

export const CEREMONY_CONFIGS = {
  GLOBAL_ACADEMY: {
    key: "GLOBAL_ACADEMY",
    name: "Global Academy Awards",
    scope: "GLOBAL",
    weekHeld: 52,
    prestigeMultiplier: 2.0,
    categories: ["BEST_PICTURE", "BEST_DIRECTOR", "BEST_ACTOR", "BEST_SCREENPLAY", "BEST_VFX"],
    juries: [
      { id: "j1", name: "Academy Senior Branch", bias: "ARTISTIC_AUTEUR", votingWeight: 1.5 },
      { id: "j2", name: "Global Critic Guild", bias: "CRITIC_DARLING", votingWeight: 1.2 },
      { id: "j3", name: "Industry Commercial Panel", bias: "COMMERCIAL_BOX_OFFICE", votingWeight: 1.0 },
    ],
  },
  INTERNATIONAL_GOLDEN_GLOBE: {
    key: "INTERNATIONAL_GOLDEN_GLOBE",
    name: "International Golden Globe Circuit",
    scope: "INTERNATIONAL",
    weekHeld: 48,
    prestigeMultiplier: 1.5,
    categories: ["BEST_PICTURE", "BEST_DIRECTOR", "BEST_ACTOR"],
    juries: [
      { id: "j1", name: "Foreign Press Jury", bias: "STAR_POWER", votingWeight: 1.4 },
      { id: "j2", name: "Global Broadcasters", bias: "BALANCED", votingWeight: 1.0 },
    ],
  },
  DOMESTIC_GUILD: {
    key: "DOMESTIC_GUILD",
    name: "Domestic Guild Honors",
    scope: "DOMESTIC",
    weekHeld: 44,
    prestigeMultiplier: 1.25,
    categories: ["BEST_DIRECTOR", "BEST_ACTOR", "BEST_SCREENPLAY"],
    juries: [
      { id: "j1", name: "Craft & Technical Guild", bias: "ARTISTIC_AUTEUR", votingWeight: 1.3 },
    ],
  },
  NATIONAL_INDIE_SPIRIT: {
    key: "NATIONAL_INDIE_SPIRIT",
    name: "National Indie Spirit Trophies",
    scope: "NATIONAL",
    weekHeld: 40,
    prestigeMultiplier: 1.1,
    categories: ["BEST_PICTURE", "BEST_SCREENPLAY"],
    juries: [
      { id: "j1", name: "Independent Film Panel", bias: "CRITIC_DARLING", votingWeight: 1.6 },
    ],
  },
};

/**
 * Calculates eligibility score for a movie/talent in a category.
 */
export const calculateCategoryScore = (movie, categoryKey, fycSpent = 0, juryBias = "BALANCED") => {
  let base = (movie.quality || 50) * 0.4 + (movie.criticScore || 50) * 0.4 + (movie.audienceScore || 50) * 0.2;
  
  if (categoryKey === "BEST_DIRECTOR") {
    base = (movie.quality || 50) * 0.6 + (movie.criticScore || 50) * 0.4;
  } else if (categoryKey === "BEST_ACTOR") {
    base = (movie.audienceScore || 50) * 0.5 + (movie.quality || 50) * 0.5;
  } else if (categoryKey === "BEST_VFX") {
    base = (movie.budget || 1000000) / 100000 + (movie.quality || 50) * 0.3;
  }

  // FYC spending boost (diminishing returns)
  const fycBoost = Math.min(25, Math.sqrt(fycSpent / 1000) * 2);

  // Jury bias adjustment
  let biasMultiplier = 1.0;
  if (juryBias === "ARTISTIC_AUTEUR" && movie.quality > 75) biasMultiplier = 1.25;
  if (juryBias === "COMMERCIAL_BOX_OFFICE" && (movie.boxOffice || 0) > 10000000) biasMultiplier = 1.3;
  if (juryBias === "CRITIC_DARLING" && (movie.criticScore || 0) > 80) biasMultiplier = 1.25;

  return Math.round((base + fycBoost) * biasMultiplier);
};

/**
 * Evaluates submissions, computes nominations & deterministic winners for a V2 award ceremony.
 */
export const processCeremony = async (gameState, ceremonyKey) => {
  const config = CEREMONY_CONFIGS[ceremonyKey];
  if (!config) return null;

  const year = Math.floor((gameState.currentWeek - 1) / 52) + 1;
  const startWeek = Math.max(1, gameState.currentWeek - 51);
  const endWeek = gameState.currentWeek;

  const eligibleMovies = await Movie.find({
    status: "RELEASED",
    releaseWeek: { $gte: startWeek, $lte: endWeek },
  }).lean();

  if (eligibleMovies.length === 0) return null;

  let ceremony = await AwardCeremonyV2.findOne({
    gameStateId: gameState._id,
    year,
    ceremonyKey,
  });

  if (!ceremony) {
    ceremony = new AwardCeremonyV2({
      gameStateId: gameState._id,
      ceremonyKey,
      name: config.name,
      scope: config.scope,
      year,
      weekHeld: gameState.currentWeek,
      status: "COMPLETED",
      prestigeMultiplier: config.prestigeMultiplier,
      juries: config.juries,
      categories: [],
    });
  }

  const categoryResults = [];

  for (const catKey of config.categories) {
    const submissions = eligibleMovies.map((m) => {
      const primaryJuryBias = config.juries[0]?.bias || "BALANCED";
      const score = calculateCategoryScore(m, catKey, 0, primaryJuryBias);
      return {
        movieId: m._id,
        movieTitle: m.title,
        studioId: m.studioId,
        studioName: m.studioName || "Rival Studio",
        talentName: catKey === "BEST_DIRECTOR" ? (m.directorName || "Unknown Director") : (m.leadActorName || "Cast"),
        score,
        fycSpent: 0,
        isNominated: false,
        isWinner: false,
      };
    });

    // Sort by score descending to get top 5 nominations
    submissions.sort((a, b) => b.score - a.score);
    const nominations = submissions.slice(0, Math.min(5, submissions.length)).map((sub) => ({
      movieId: sub.movieId,
      movieTitle: sub.movieTitle,
      studioId: sub.studioId,
      studioName: sub.studioName,
      talentName: sub.talentName,
      votesReceived: sub.score * Math.round(config.prestigeMultiplier * 10),
    }));

    // Deterministic winner selection: top vote getter
    const winnerSub = nominations[0];
    const prestigeAwarded = Math.round(500 * config.prestigeMultiplier);

    categoryResults.push({
      categoryKey: catKey,
      categoryName: catKey.replace("_", " "),
      submissions,
      nominations,
      winner: {
        movieId: winnerSub.movieId,
        movieTitle: winnerSub.movieTitle,
        studioId: winnerSub.studioId,
        studioName: winnerSub.studioName,
        talentName: winnerSub.talentName,
        prestigeAwarded,
      },
    });

    // Update winning studio prestige & stats if player studio
    if (winnerSub.studioId) {
      const studio = await Studio.findById(winnerSub.studioId);
      if (studio) {
        studio.prestige = (studio.prestige || 0) + prestigeAwarded;
        studio.stats = studio.stats || {};
        studio.stats.awardsWon = (studio.stats.awardsWon || 0) + 1;
        await studio.save();

        await Notification.create({
          gameStateId: gameState._id,
          type: "AWARDS",
          message: `🏆 ${config.name} (${year}): '${winnerSub.movieTitle}' won ${catKey.replace("_", " ")}! Gained +${prestigeAwarded} prestige!`,
          createdAt: new Date(),
        });
      }
    }
  }

  ceremony.categories = categoryResults;
  ceremony.status = "COMPLETED";
  await ceremony.save();

  // Record in PastAward for historical persistence
  const bestPictureCat = categoryResults.find((c) => c.categoryKey === "BEST_PICTURE") || categoryResults[0];
  if (bestPictureCat) {
    await PastAward.create({
      gameStateId: gameState._id,
      studioId: bestPictureCat.winner.studioId,
      year,
      bestPictureId: bestPictureCat.winner.movieId?.toString(),
      bestPictureTitle: bestPictureCat.winner.movieTitle,
      bestDirectorName: bestPictureCat.winner.talentName,
    });
  }

  return ceremony;
};

/**
 * Runs annual V2 award ceremonies pipeline at corresponding weeks.
 */
export const processV2AwardCeremoniesTick = async (gameState) => {
  const currentWeek = gameState.currentWeek;

  for (const config of Object.values(CEREMONY_CONFIGS)) {
    if (currentWeek % 52 === config.weekHeld || (config.weekHeld === 52 && currentWeek % 52 === 0)) {
      await processCeremony(gameState, config.key);
    }
  }
};
