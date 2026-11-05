import CelebrityScandal from "../models/CelebrityScandal.js";
import Studio from "../models/Studio.js";
import Movie from "../models/Movie.js";
import {
  PR_STRATEGIES,
  SCANDAL_TYPES,
  evaluatePRStrategy,
  calculateMovieBoxOfficeModifier,
  calculateScandalProbability,
} from "../services/simulation/engines/scandalEngine.js";

/**
 * Resolves the Studio associated with the current authenticated user.
 */
const getStudioForRequest = async (req) => {
  if (req.user?._id) {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (studio) return studio;
  }
  if (req.user?.studioId) {
    const studio = await Studio.findById(req.user.studioId);
    if (studio) return studio;
  }
  if (req.query?.studioId || req.body?.studioId) {
    const studio = await Studio.findById(req.query?.studioId || req.body?.studioId);
    if (studio) return studio;
  }
  return null;
};

/**
 * Get all scandals for the authenticated studio
 */
export async function getStudioScandals(req, res, next) {
  try {
    const studio = await getStudioForRequest(req);
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const scandals = await CelebrityScandal.find({ studioId: studio._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: scandals,
      count: scandals.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get active scandals currently draining reputation
 */
export async function getActiveScandals(req, res, next) {
  try {
    const studio = await getStudioForRequest(req);
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const scandals = await CelebrityScandal.find({
      studioId: studio._id,
      status: { $in: ["ACTIVE", "CONTAINED"] },
    }).sort({ publicOutrage: -1 });

    return res.status(200).json({
      success: true,
      data: scandals,
      count: scandals.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get catalog of PR/Legal response strategies
 */
export function getAvailableStrategies(req, res) {
  return res.status(200).json({
    success: true,
    data: PR_STRATEGIES,
  });
}

/**
 * Trigger or register a new celebrity scandal
 */
export async function triggerScandal(req, res, next) {
  try {
    const studio = await getStudioForRequest(req);
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }
    const studioId = studio._id;

    const {
      talentId,
      talentName,
      talentRole = "Actor",
      scandalType = "DRUG_USE",
      severity,
    } = req.body;

    if (!talentId || !talentName) {
      return res
        .status(400)
        .json({ success: false, message: "talentId and talentName are required" });
    }

    const typeConfig = SCANDAL_TYPES[scandalType] || SCANDAL_TYPES.DRUG_USE;
    const finalSeverity = severity || typeConfig.baseSeverity;

    // Find any active movies with this talent
    const activeMovies = await Movie.find({
      studioId,
      status: { $in: ["IN_PRODUCTION", "READY_FOR_RELEASE", "RELEASED"] },
    });

    const involvedMovieIds = activeMovies
      .filter((m) => {
        const castIds = (m.cast || []).map((c) => String(c.actorId || c._id || c));
        return (
          castIds.includes(String(talentId)) ||
          String(m.directorId) === String(talentId) ||
          String(m.writerId) === String(talentId)
        );
      })
      .map((m) => m._id);

    const scandal = await CelebrityScandal.create({
      studioId,
      talentId,
      talentName,
      talentRole,
      scandalType,
      severity: finalSeverity,
      publicOutrage: typeConfig.baseOutrage,
      popularityPenalty: typeConfig.popularityPenalty,
      boxOfficeImpactPercent: typeConfig.boxOfficePenalty,
      reputationDrainPerWeek: typeConfig.baseDrain,
      evidenceStatus: "LEAKED_EVIDENCE",
      mediaExposure: "NATIONAL_HEADLINES",
      status: "ACTIVE",
      activeMovieIds: involvedMovieIds,
      historyLog: [
        {
          week: 1,
          event: `Scandal leaked: ${talentName} caught in ${scandalType.replace(/_/g, " ")}.`,
          sentimentShift: -typeConfig.popularityPenalty,
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Scandal surfaced in media",
      data: scandal,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Execute a PR / Legal strategy against an active scandal
 */
export async function respondToScandal(req, res, next) {
  try {
    const { id } = req.params;
    const { strategyKey } = req.body;

    const userStudio = await getStudioForRequest(req);
    if (!userStudio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const scandal = await CelebrityScandal.findById(id);
    if (!scandal) {
      return res.status(404).json({ success: false, message: "Scandal not found" });
    }

    if (String(scandal.studioId) !== String(userStudio._id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Scandal does not belong to your studio",
      });
    }

    const studioFunds = Number(userStudio.money ?? userStudio.cash ?? 0);
    const outcome = evaluatePRStrategy(scandal, strategyKey, studioFunds);
    if (!outcome.success) {
      return res.status(400).json(outcome);
    }

    // Deduct cost from studio funds
    if (outcome.cost > 0) {
      userStudio.money = Math.max(0, Number(userStudio.money || 0) - outcome.cost);
      if (userStudio.cash !== undefined) {
        userStudio.cash = Math.max(0, Number(userStudio.cash || 0) - outcome.cost);
      }
      await userStudio.save();
    }

    scandal.publicOutrage = outcome.publicOutrage;
    scandal.status = outcome.status;
    scandal.evidenceStatus = outcome.evidenceStatus;
    scandal.recoveryProgress = outcome.recoveryProgress;
    scandal.chosenPRStrategy = outcome.chosenPRStrategy;
    scandal.strategyCost = (scandal.strategyCost || 0) + outcome.cost;
    scandal.boxOfficeImpactPercent = outcome.boxOfficeImpactPercent;
    scandal.reputationDrainPerWeek = outcome.reputationDrainPerWeek;

    scandal.historyLog.push({
      week: scandal.weeksActive || 1,
      event: outcome.message,
      sentimentShift: Math.round((100 - outcome.publicOutrage) / 5),
    });

    await scandal.save();

    return res.status(200).json({
      success: true,
      message: outcome.message,
      data: scandal,
      studioCashRemaining: userStudio.money,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get movie box office modifier based on active scandals
 */
export async function getMovieScandalImpact(req, res, next) {
  try {
    const { movieId } = req.params;
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const activeScandals = await CelebrityScandal.find({
      studioId: movie.studioId,
      status: "ACTIVE",
    });

    const modifier = calculateMovieBoxOfficeModifier(movie, activeScandals);

    return res.status(200).json({
      success: true,
      data: {
        movieId,
        boxOfficeModifier: modifier,
        activeScandalsAffecting: activeScandals.filter((sc) =>
          sc.activeMovieIds?.map(String).includes(String(movieId))
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}
