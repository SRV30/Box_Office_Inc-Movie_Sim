import Movie from "../models/Movie.js";
import GameState from "../models/GameState.js";
import Studio from "../models/Studio.js";
import Franchise from "../models/Franchise.js";
import { generateReviews } from "../services/simulation/engines/reviewEngine.js";
import { generateBoxOffice } from "../services/simulation/engines/boxOfficeEngine.js";
import { generateBoxOfficeProjection } from "../services/simulation/engines/analystProjectionEngine.js";
import { getGenreMultiplier } from "../services/simulation/engines/trendEngine.js";
import { getDemographicMultiplier } from "../services/simulation/engines/demographicsEngine.js";
import { processCareerImpact } from "../services/simulation/engines/careerImpactEngine.js";
import { processStudioGrowth } from "../services/simulation/engines/studioGrowthEngine.js";
import { computeFranchiseProgress } from "../services/simulation/engines/franchiseEngine.js";
import { addNotification } from "../services/simulation/helpers/notificationHelper.js";
import { MARKETING_CAMPAIGNS, getEffectiveHypeBoost } from "../constants/marketingCampaigns.js";
import { SOUNDTRACK_TIERS, getSoundtrackBoosts } from "../constants/soundtrackTiers.js";
import { generateMovieTitle } from "../services/movie/movieService.js";
import { generateNewsFromRelease } from "../services/simulation/engines/newsEngine.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";
import Notification from "../models/Notification.js";
import logger from "../utils/logger.js";
import { performMovieRelease } from "../services/movie/releaseService.js";
import { addHistoricRecord } from "../services/simulation/helpers/historicRecordHelper.js";
import { backfillMovieNames } from "../services/movie/talentBackfillService.js";
import {
  validateScript,
  validateDirector,
  validateLeadActor,
  validateSupportingActors,
  validateCrewTeam,
  findScriptById,
  ValidationError,
} from "../services/movie/movieValidationService.js";

const findGameState = async (userId) => GameState.findOne({ user: userId });

export const createMovie = async (req, res) => {
  try {
    const { title, scriptId, directorId, leadActorId, supportingActorIds, marketingCampaignIds, soundtrackTier, coProducerStudioId, coProducerShare } = req.body;

    if (!title || !scriptId || !directorId || !leadActorId || !req.body.crewTeamId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const gameState = await findGameState(req.user._id);
    const studio = await Studio.findOne({ owner: req.user._id });

    if (!gameState || !studio) {
      return res.status(404).json({ success: false, message: "Game state or studio not found" });
    }

    // Perform ALL validations prior to any mutations
    const { script } = validateScript(gameState, scriptId);
    const director = validateDirector(gameState, directorId);
    const leadActor = validateLeadActor(gameState, leadActorId);
    const supportingActors = validateSupportingActors(gameState, supportingActorIds);
    const crewTeam = validateCrewTeam(gameState, req.body.crewTeamId);

    // Soundtrack selection validation
    const soundtrackTierId = soundtrackTier || "PUBLIC_DOMAIN";
    if (!SOUNDTRACK_TIERS[soundtrackTierId]) {
      return res.status(400).json({ success: false, message: "Invalid soundtrack tier" });
    }
    const soundtrackConfig = SOUNDTRACK_TIERS[soundtrackTierId];
    const soundtrackCost = soundtrackConfig.cost;
    const { qualityBoost: stQualityBoost, hypeBoost: stHypeBoost } = getSoundtrackBoosts(soundtrackTierId, script.genres);

    // Calculate Marketing Budget and Hype Boost
    let marketingBudget = 0;
    let marketingHypeBoost = 0;
    const selectedCampaigns = [];

    if (marketingCampaignIds && Array.isArray(marketingCampaignIds)) {
      marketingCampaignIds.forEach(cid => {
        const campaign = MARKETING_CAMPAIGNS.find(c => c.id === cid);
        if (campaign) {
          marketingBudget += campaign.cost;
          marketingHypeBoost += getEffectiveHypeBoost(campaign, script.genres);
          selectedCampaigns.push(cid);
        }
      });
    }

    // Validate Co-Production parameters
    const share = Number(coProducerShare || 0);
    if (share < 0 || share > 50) {
      return res.status(400).json({ success: false, message: "Co-producer share must be between 0% and 50%" });
    }

    const playerMarketingBudget = (marketingBudget || 0) * (1 - share / 100);

    if (studio.money < playerMarketingBudget) {
      return res.status(400).json({ success: false, message: "Insufficient funds for marketing" });
    }

    const quality = Math.round(
      (script.quality * 0.35) +
      (director.creativity * 0.25) +
      (leadActor.actingSkill * 0.20) +
      (crewTeam.technicalQuality * 0.20) +
      stQualityBoost
    );

    const hype = Math.min(100, Math.round(
      (leadActor.popularity * 0.4) +
      (director.reputation * 0.3) +
      marketingHypeBoost +
      stHypeBoost
    ));

    const totalProductionWeeks = 20;
    const scriptCost = script.price || 0;
    const directorCost = director.salary * totalProductionWeeks;
    const leadActorCost = leadActor.salary * totalProductionWeeks;
    const crewCost = crewTeam.salary * totalProductionWeeks;

    let supportingActorCost = 0;
    if (supportingActorIds && Array.isArray(supportingActorIds)) {
      supportingActorIds.forEach(id => {
        const act = gameState.ownedActors.find(a => a.id === id);
        if (act) supportingActorCost += act.salary * totalProductionWeeks;
      });
    }

    const totalBudget = scriptCost + directorCost + leadActorCost + supportingActorCost + crewCost + marketingBudget + soundtrackCost;

    let createdMovie = null;

    // Execute all mutations atomically in a MongoDB transaction
    await withTransaction(async (session) => {
      const s = await Studio.findOne({ _id: studio._id, money: { $gte: playerMarketingBudget } }).session(session);
      if (!s) {
        throw new Error("Insufficient funds for marketing");
      }
      s.money -= playerMarketingBudget;
      await s.save({ session });

      let franchiseId = req.body.franchiseId || null;
      let sequelNumber = 1;

      if (req.body.createFranchise && req.body.franchiseName) {
        const [newFranchise] = await Franchise.create(
          [
            {
              name: req.body.franchiseName,
              studioId: s._id,
              movies: [],
            },
          ],
          { session }
        );
        franchiseId = newFranchise._id;
      }

      if (franchiseId) {
        const franchise = await Franchise.findById(franchiseId).session(session);
        if (franchise) {
          sequelNumber = franchise.movies.length + 1;
        }
      }

      const [movie] = await Movie.create(
        [
          {
            title,
            studioId: s._id,
            scriptId,
            directorId,
            directorName: director.name,
            leadActorId,
            leadActorName: leadActor.name,
            supportingActorIds: supportingActorIds || [],
            crewTeamId: crewTeam.id,
            crewTeamName: crewTeam.name,
            budget: totalBudget,
            budgetBreakdown: {
              scriptCost,
              directorCost,
              leadActorCost,
              supportingActorCost,
              crewCost,
              marketingCost: marketingBudget,
              soundtrackCost,
            },
            marketingBudget,
            marketingCampaigns: selectedCampaigns,
            quality,
            hype,
            status: "PRE_PRODUCTION",
            createdWeek: gameState.currentWeek,
            productionProgress: 0,
            remainingWeeks: totalProductionWeeks,
            franchiseId,
            sequelNumber,
            soundtrackTier: soundtrackTierId,
            coProducerStudioId: coProducerStudioId || null,
            coProducerShare: share,
          },
        ],
        { session }
      );

      if (franchiseId) {
        await Franchise.findByIdAndUpdate(
          franchiseId,
          { $push: { movies: movie._id } },
          { session }
        );
      }

      // Update talent & script statuses on GameState
      const gs = await GameState.findById(gameState._id).session(session);
      const gsScript = gs.ownedScripts.find(scr => scr.id === scriptId);
      if (gsScript) gsScript.status = "SOLD";

      const gsDirector = gs.ownedDirectors.find(d => d.id === directorId);
      if (gsDirector) {
        gsDirector.status = "BUSY";
        gsDirector.busyUntilWeek = gs.currentWeek + 20;
      }

      const gsLeadActor = gs.ownedActors.find(a => a.id === leadActorId);
      if (gsLeadActor) {
        gsLeadActor.status = "BUSY";
        gsLeadActor.busyUntilWeek = gs.currentWeek + 20;
      }

      if (supportingActorIds && Array.isArray(supportingActorIds)) {
        gs.ownedActors.forEach(actor => {
          if (supportingActorIds.includes(actor.id)) {
            actor.status = "BUSY";
            actor.busyUntilWeek = gs.currentWeek + 20;
          }
        });
      }

      const gsCrew = gs.ownedCrewTeams?.find(c => c.id === req.body.crewTeamId);
      if (gsCrew) {
        gsCrew.status = "BUSY";
        gsCrew.busyUntilWeek = gs.currentWeek + 20;
      }

      gs.activeMovies.push(movie._id);

      await Notification.create(
        [
          {
            gameStateId: gs._id,
            message: `Production started for "${title}". Quality: ${quality}, Hype: ${hype}`,
            createdAt: new Date(),
          },
        ],
        { session }
      );

      await gs.save({ session });
      createdMovie = movie;
    });

    res.status(201).json({ success: true, movie: createdMovie });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveMovies = async (req, res) => {
    try {
        const gameState = await GameState.findOne({ user: req.user._id }).lean();
        if (!gameState) return res.status(404).json({ success: false, message: "Game state not found" });

        const movies = await Movie.find({ _id: { $in: gameState.activeMovies } }).lean();
        
        await backfillMovieNames(movies, gameState);

        res.status(200).json({ success: true, movies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateTitle = async (req, res) => {
    try {
        const title = generateMovieTitle();
        res.status(200).json({ success: true, title });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const releaseMovie = async (req, res) => {
    try {
        const { id } = req.params;

        // Ownership is enforced in the query, not after it.
        //
        // Filtering by studioId means a movie belonging to another studio is
        // never loaded, so the 404 below covers both "no such movie" and "not
        // yours" — a caller probing IDs learns nothing either way.
        const ownerStudio = await Studio.findOne({ owner: req.user._id }).select("_id").lean();
        if (!ownerStudio) return res.status(404).json({ success: false, message: "Studio not found" });

        const movie = await Movie.findOne({ _id: id, studioId: ownerStudio._id });
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
        if (movie.status !== "READY_FOR_RELEASE") {
            return res.status(400).json({ success: false, message: "Movie is not ready for release" });
        }

        const result = await withTransaction(async (session) => {
            const gameState = await findGameState(req.user._id);
            const studio = await Studio.findOne({ owner: req.user._id });

            const releaseResult = await performMovieRelease(movie, studio, gameState, session);
            return releaseResult;
        });

        res.status(200).json({ success: true, movie: result.movie, growth: result.growth });
    } catch (error) {
        logger.error("Release Movie Error", { error: error.message, movieId: id });
        res.status(500).json({ success: false, message: `Operation rolled back due to: ${error.message}` });
    }
};

export const scheduleRelease = async (req, res) => {
    try {
        const { id } = req.params;
        const { releaseWeek } = req.body;

        if (!releaseWeek || typeof releaseWeek !== "number") {
            return res.status(400).json({ success: false, message: "releaseWeek (number) is required." });
        }

        const gameState = await GameState.findOne({ user: req.user._id });
        if (!gameState) return res.status(404).json({ success: false, message: "Game state not found" });

        if (releaseWeek <= gameState.currentWeek) {
            return res.status(400).json({ success: false, message: "scheduledReleaseWeek must be in the future." });
        }

        const studio = await Studio.findOne({ owner: req.user._id }).select("_id").lean();
        if (!studio) return res.status(404).json({ success: false, message: "Studio not found" });

        const movie = await Movie.findOne({ _id: id, studioId: studio._id });
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
        if (movie.status !== "READY_FOR_RELEASE" && movie.status !== "POST_PRODUCTION") {
            return res.status(400).json({ success: false, message: "Only post-production or ready-for-release movies can be scheduled." });
        }

        movie.scheduledReleaseWeek = releaseWeek;
        await movie.save();

        res.status(200).json({
            success: true,
            message: `"${movie.title}" scheduled for release in week ${releaseWeek}.`,
            scheduledReleaseWeek: releaseWeek,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getReleasedMovies = async (req, res) => {
    try {
        const studio = await Studio.findOne({ owner: req.user._id }).select("_id").lean();
        if (!studio) return res.status(404).json({ success: false, message: "Studio not found" });

        const gameState = await GameState.findOne({ user: req.user._id }).lean();

        const movies = await Movie.find({
            studioId: studio._id,
            status: { $in: ["RELEASED", "RELEASED_STREAMING"] },
        })
            .sort({ createdAt: -1 })
            .lean();

        if (gameState) {
            await backfillMovieNames(movies, gameState);
        }

        res.status(200).json({ success: true, movies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMovieDetails = async (req, res) => {
    try {
        const studio = await Studio.findOne({ owner: req.user._id }).select("_id").lean();
        if (!studio) return res.status(404).json({ success: false, message: "Studio not found" });

        const movie = await Movie.findOne({ _id: req.params.id, studioId: studio._id }).lean();
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

        const gameState = await GameState.findOne({ user: req.user._id }).lean();
        if (gameState) {
            await backfillMovieNames([movie], gameState);
        }

        res.status(200).json({ success: true, movie });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMovieTracking = async (req, res) => {
    try {
        const studio = await Studio.findOne({ owner: req.user._id }).select("_id").lean();
        if (!studio) return res.status(404).json({ success: false, message: "Studio not found" });

        const movie = await Movie.findOne({ _id: req.params.id, studioId: studio._id }).lean();
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

        const allowedStatuses = ["READY_FOR_RELEASE", "POST_PRODUCTION", "PRODUCTION"];
        if (!allowedStatuses.includes(movie.status)) {
            return res.status(400).json({ success: false, message: "Analyst projections are only available before release." });
        }

        const gameState = await GameState.findOne({ user: req.user._id }).lean();
        const marketMultiplier = gameState?.marketTrends?.activeTrends
            ? 1 // trendEngine.getGenreMultiplier not called here to keep this stateless
            : 1;

        const leadActor = gameState?.ownedActors?.find(a => a.id === movie.leadActorId) ||
                          { popularity: 50 };

        const projection = generateBoxOfficeProjection(movie, leadActor, marketMultiplier);

        res.status(200).json({ success: true, projection });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addMarketingCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { campaignId } = req.body;

    const campaign = MARKETING_CAMPAIGNS.find(c => c.id === campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign type not found" });
    }

    let movie;
    let studio;
    let effectiveHype = 0;

    await withTransaction(async (session) => {
      // The studio is resolved first, so the movie lookup can filter on it.
      //
      // Previously the movie was fetched with no ownership filter and the
      // studio only afterwards, at which point funds were deducted from the
      // *caller's* studio for a campaign attached to someone else's movie —
      // paying to promote a rival's film, or draining a balance by repeating
      // the call.
      studio = await Studio.findOne({ owner: req.user._id }).session(session);
      if (!studio) {
        const error = new Error("Studio not found");
        error.statusCode = 404;
        throw error;
      }

      movie = await Movie.findOne({ _id: id, studioId: studio._id }).session(session);
      if (!movie) {
        const error = new Error("Movie not found");
        error.statusCode = 404;
        throw error;
      }

      if (movie.status === "RELEASED" || movie.status === "RELEASED_STREAMING") {
        const error = new Error("Cannot add marketing to a released movie");
        error.statusCode = 400;
        throw error;
      }

      if (movie.marketingCampaigns.includes(campaignId)) {
        const error = new Error("This campaign is already active for this movie");
        error.statusCode = 400;
        throw error;
      }

      if (studio.money < campaign.cost) {
        const error = new Error("Insufficient funds for this campaign");
        error.statusCode = 400;
        throw error;
      }

      const gameState = await GameState.findOne({ user: req.user._id }).session(session);
      const script = gameState?.ownedScripts?.find(s => s.id === movie.scriptId) || 
                     gameState?.marketScripts?.find(s => s.id === movie.scriptId);
      
      const genres = script?.genres || [];
      effectiveHype = getEffectiveHypeBoost(campaign, genres);

      movie.marketingCampaigns.push(campaignId);
      movie.marketingBudget += campaign.cost;
      movie.hype = Math.min(100, movie.hype + effectiveHype);

      studio.money -= campaign.cost;

      await movie.save({ session });
      await studio.save({ session });
    });

    res.status(200).json({
      success: true,
      message: `Successfully launched ${campaign.name} for "${movie.title}"! Hype increased by +${effectiveHype}`,
      movie,
      studioMoney: studio.money
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Re-release a movie in theaters or as a Director's Cut.
 * POST /api/movies/:id/rerelease
 *
 * Requirements:
 * - Movie must have status RELEASED
 * - Must be at least 52 weeks since original release
 * - Studio must have enough money for the fee
 */
export const reReleaseMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDirectorsCut } = req.body;

    const ownerStudio = await Studio.findOne({ owner: req.user._id }).select("_id").lean();
    if (!ownerStudio) {
      return res.status(404).json({ success: false, message: "Studio not found." });
    }

    const movie = await Movie.findOne({ _id: id, studioId: ownerStudio._id });
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found.",
      });
    }

    if (movie.status !== "RELEASED" && movie.status !== "RELEASED_STREAMING") {
      return res.status(400).json({
        success: false,
        message: "Only released movies can be re-released.",
      });
    }

    const gameState = await GameState.findOne({ user: req.user._id });
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: "Game state not found.",
      });
    }

    const weeksSinceRelease = (gameState.currentWeek || 0) - (movie.releaseWeek || 0);
    if (weeksSinceRelease < 52) {
      return res.status(400).json({
        success: false,
        message: `Movie must be at least 52 weeks old for re-release. Current age: ${weeksSinceRelease} weeks.`,
      });
    }

    if (movie.isReRelease) {
      return res.status(400).json({
        success: false,
        message: "This movie has already been re-released.",
      });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found.",
      });
    }

    // Re-release fee: 20% of original budget; Director's Cut costs 30%
    const feeMultiplier = isDirectorsCut ? 0.3 : 0.2;
    const fee = Math.round((movie.budget || 0) * feeMultiplier);

    if (Number(studio.money || 0) < fee) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Re-release costs ₹${fee.toLocaleString()}.`,
      });
    }
  
    // Calculate re-release box office (decaying factor of original)
    const decayFactor = isDirectorsCut ? 0.35 : 0.2;
    const qualityBoost = isDirectorsCut ? 10 : 0;
    const reReleaseGross = Math.round((movie.worldwideGross || movie.boxOffice || 0) * decayFactor);

    // Apply changes
    studio.money = Number(studio.money || 0) - fee + reReleaseGross;
    movie.isReRelease = true;
    movie.reReleaseWeek = gameState.currentWeek;
    movie.directorCutQualityBoost = qualityBoost;
    movie.reReleaseRevenue = reReleaseGross;
    movie.worldwideGross = (movie.worldwideGross || 0) + reReleaseGross;
    movie.boxOffice = (movie.boxOffice || 0) + reReleaseGross;

    await movie.save();
    await studio.save();

    addNotification(
      gameState,
      `"${movie.title}" ${isDirectorsCut ? "Director's Cut" : "Re-Release"} earned ₹${reReleaseGross.toLocaleString()} at the box office!`
    );
    await gameState.save();

    res.status(200).json({
      success: true,
      message: `"${movie.title}" re-released successfully!`,
      data: {
        reReleaseRevenue: reReleaseGross,
        fee,
        qualityBoost,
        newWorldwideGross: movie.worldwideGross,
      },
    });
  } catch (error) {
    console.error("Error re-releasing movie:", error);
    res.status(500).json({
      success: false,
      message: "Failed to re-release movie.",
    });
  }
};
