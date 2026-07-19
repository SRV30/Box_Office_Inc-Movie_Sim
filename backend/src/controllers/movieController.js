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
import { generateMovieTitle } from "../services/movie/movieService.js";
import { generateNewsFromRelease } from "../services/simulation/engines/newsEngine.js";
import { withTransaction } from "../utils/financeTransactionHelper.js";
import Notification from "../models/Notification.js";
import logger from "../utils/logger.js";

const findGameState = async (userId) => GameState.findOne({ user: userId });

/**
 * Lazy backfill helper for older movie documents that lack human-readable names.
 * Ensures the UI can always display names without massive DB migrations.
 */
const lazyBackfillNames = async (movies, gameState) => {
    let anyUpdates = false;

    // Create lookup maps only if there are movies missing names
    let talentMap = null;
    const getTalentMap = () => {
        if (!talentMap) {
            talentMap = new Map();
            const addAll = (list) => {
                if (list && Array.isArray(list)) {
                    list.forEach(t => talentMap.set(t.id, t.name));
                }
            };
            addAll(gameState.ownedDirectors);
            addAll(gameState.retiredDirectors);
            addAll(gameState.ownedActors);
            addAll(gameState.retiredActors);
            addAll(gameState.ownedCrewTeams);
        }
        return talentMap;
    };

    for (const movie of movies) {
        let needsSave = false;
        const updates = {};

        if (!movie.directorName && movie.directorId) {
            const name = getTalentMap().get(movie.directorId) || "Unknown Director";
            movie.directorName = name;
            updates.directorName = name;
            needsSave = true;
        }
        if (!movie.leadActorName && movie.leadActorId) {
            const name = getTalentMap().get(movie.leadActorId) || "Unknown Actor";
            movie.leadActorName = name;
            updates.leadActorName = name;
            needsSave = true;
        }
        if (!movie.crewTeamName && movie.crewTeamId) {
            const name = getTalentMap().get(movie.crewTeamId) || "Unknown Crew";
            movie.crewTeamName = name;
            updates.crewTeamName = name;
            needsSave = true;
        }

        if (needsSave) {
            // Persist the backfill to DB so it doesn't need to happen again
            await Movie.updateOne({ _id: movie._id }, { $set: updates });
            anyUpdates = true;
        }
    }
    return anyUpdates;
};

export const createMovie = async (req, res) => {
  try {
    const { title, scriptId, directorId, leadActorId, supportingActorIds, marketingCampaignIds } = req.body;

    if (!title || !scriptId || !directorId || !leadActorId || !req.body.crewTeamId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const gameState = await findGameState(req.user._id);
    const studio = await Studio.findOne({ owner: req.user._id });

    if (!gameState || !studio) {
      return res.status(404).json({ success: false, message: "Game state or studio not found" });
    }

    // Validate Script
    const scriptIndex = gameState.ownedScripts.findIndex(s => s.id === scriptId);
    if (scriptIndex === -1) return res.status(404).json({ success: false, message: "Script not found" });
    const script = gameState.ownedScripts[scriptIndex];
    if (script.status !== "AVAILABLE") return res.status(400).json({ success: false, message: "Script is not available" });

    // Validate Director
    const director = gameState.ownedDirectors.find(d => d.id === directorId);
    if (!director) return res.status(404).json({ success: false, message: "Director not found" });
    if (director.status !== "AVAILABLE") return res.status(400).json({ success: false, message: "Director is busy" });

    // Validate Lead Actor
    const leadActor = gameState.ownedActors.find(a => a.id === leadActorId);
    if (!leadActor) return res.status(404).json({ success: false, message: "Lead actor not found" });
    if (leadActor.status !== "AVAILABLE") return res.status(400).json({ success: false, message: "Lead actor is busy" });

    // Validate Supporting Actors
    const supportingActors = [];
    if (supportingActorIds && Array.isArray(supportingActorIds)) {
        for (const actorId of supportingActorIds) {
            const actor = gameState.ownedActors.find(a => a.id === actorId);
            if (!actor) return res.status(404).json({ success: false, message: `Supporting actor ${actorId} not found` });
            if (actor.status !== "AVAILABLE") return res.status(400).json({ success: false, message: `Supporting actor ${actor.name} is busy` });
            supportingActors.push(actor);
        }
    }

    // Validate Crew Team
    const crewTeam = gameState.ownedCrewTeams.find(c => c.id === req.body.crewTeamId);
    if (!crewTeam) return res.status(404).json({ success: false, message: "Crew team not found" });
    if (crewTeam.status !== "AVAILABLE") return res.status(400).json({ success: false, message: "Crew team is busy" });

    // Calculate Marketing Budget and Hype Boost
    let marketingBudget = 0;
    let marketingHypeBoost = 0;
    const selectedCampaigns = [];

    if (marketingCampaignIds && Array.isArray(marketingCampaignIds)) {
        marketingCampaignIds.forEach(cid => {
            const campaign = MARKETING_CAMPAIGNS.find(c => c.id === cid);
            if (campaign) {
                marketingBudget += campaign.cost;
                // Genre-specific effectiveness: a campaign that matches the
                // script's genres yields more hype. Neutral (x1) for unlisted
                // genre/campaign pairs, so existing behaviour is preserved.
                marketingHypeBoost += getEffectiveHypeBoost(campaign, script.genres);
                selectedCampaigns.push(cid);
            }
        });
    }

    // Validate Studio Money for Marketing Budget
    if (studio.money < (marketingBudget || 0)) {
        return res.status(400).json({ success: false, message: "Insufficient funds for marketing" });
    }

    // Formula Implementation
    // quality = Script Quality → 35% + Director Creativity → 25% + Lead Actor Skill → 20% + Crew Technical Quality → 20%
    const quality = Math.round(
      (script.quality * 0.35) +
      (director.creativity * 0.25) +
      (leadActor.actingSkill * 0.20) +
      (crewTeam.technicalQuality * 0.20)
    );

    // Hype = Lead Actor Popularity + Director Reputation + Marketing Budget influence
    const hype = Math.min(100, Math.round(
      (leadActor.popularity * 0.4) +
      (director.reputation * 0.3) +
      marketingHypeBoost
    ));

    const totalProductionWeeks = 20; // 4 + 10 + 6
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

    const totalBudget = scriptCost + directorCost + leadActorCost + supportingActorCost + crewCost + marketingBudget;

    // Handle franchise / sequel logic
    let franchiseId = req.body.franchiseId || null;
    let sequelNumber = 1;

    if (req.body.createFranchise && req.body.franchiseName) {
      const newFranchise = await Franchise.create({
        name: req.body.franchiseName,
        studioId: studio._id,
        movies: [],
      });
      franchiseId = newFranchise._id;
    }

    if (franchiseId) {
      const franchise = await Franchise.findById(franchiseId);
      if (franchise) {
        sequelNumber = franchise.movies.length + 1;
      }
    }

    const movie = await Movie.create({
      title,
      studioId: studio._id,
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
        marketingCost: marketingBudget
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
    });

    // Add movie to franchise
    if (franchiseId) {
      await Franchise.findByIdAndUpdate(franchiseId, {
        $push: { movies: movie._id },
      });
    }

    // Update statuses
    script.status = "SOLD"; // Or a new "IN_PRODUCTION" status
    director.status = "BUSY";
    director.busyUntilWeek = gameState.currentWeek + 20; // Approx
    leadActor.status = "BUSY";
    leadActor.busyUntilWeek = gameState.currentWeek + 20;

    supportingActors.forEach(actor => {
        actor.status = "BUSY";
        actor.busyUntilWeek = gameState.currentWeek + 20;
    });

    crewTeam.status = "BUSY";
    crewTeam.busyUntilWeek = gameState.currentWeek + 20;

    // Deduct marketing budget
    studio.money -= (marketingBudget || 0);

    gameState.activeMovies.push(movie._id);

    await Notification.create({
        gameStateId: gameState._id,
        message: `Production started for "${title}". Quality: ${quality}, Hype: ${hype}`,
        createdAt: new Date()
    });

    await studio.save();
    await gameState.save();

    res.status(201).json({ success: true, movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveMovies = async (req, res) => {
    try {
        const gameState = await GameState.findOne({ user: req.user._id }).lean();
        if (!gameState) return res.status(404).json({ success: false, message: "Game state not found" });

        const movies = await Movie.find({ _id: { $in: gameState.activeMovies } }).lean();
        
        await lazyBackfillNames(movies, gameState);

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
        const studioDoc = await Studio.findOne({ owner: req.user._id }).select("_id").lean();
        if (!studioDoc) return res.status(404).json({ success: false, message: "Studio not found" });

        const movie = await Movie.findOne({ _id: id, studioId: studioDoc._id });
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
        if (movie.status !== "READY_FOR_RELEASE") {
            return res.status(400).json({ success: false, message: "Movie is not ready for release" });
        }

        const result = await withTransaction(async (session) => {
            const gameState = await findGameState(req.user._id);
            const studio = await Studio.findOne({ owner: req.user._id });

        // Get all related talent/data for engines
        const script = gameState.marketScripts.find(s => s.id === movie.scriptId) ||
                       gameState.ownedScripts.find(s => s.id === movie.scriptId);

        // Find in owned talent
        const director = gameState.ownedDirectors.find(d => d.id === movie.directorId);
        const leadActor = gameState.ownedActors.find(a => a.id === movie.leadActorId);
        const crewTeam = gameState.ownedCrewTeams.find(c => c.id === movie.crewTeamId);

        // Find Writer (might be in history or owned writers)
        const writer = gameState.ownedWriters.find(w => w.id === script?.writerId);

        // 1. Generate Reviews
        const reviews = generateReviews(movie, script, director, leadActor, crewTeam);
        movie.criticScore = reviews.criticScore;
        movie.criticLabel = reviews.criticLabel;
        movie.audienceScore = reviews.audienceScore;
        movie.audienceLabel = reviews.audienceLabel;

        // 2. Generate Box Office
        // Apply the current market climate: if a trend is active for one of
        // this movie's genres, its multiplier boosts or dampens the gross.
        const activeTrends = gameState.marketTrends?.activeTrends || [];
        const marketMultiplier = getGenreMultiplier(activeTrends, script?.genres);
        const demographicMultiplier = getDemographicMultiplier(script?.genres, movie.marketingCampaigns);
        const boxOffice = generateBoxOffice(movie, leadActor, director, marketMultiplier, demographicMultiplier);
        Object.assign(movie, boxOffice);

        // Franchise reputation (read): load the franchise's accumulated shared
        // fanbase and prestige, earned from prior installments, and feed them into
        // studio growth so this release benefits from the franchise's track record.
        // Read within the session for transactional consistency.
        let franchiseDoc = null;
        let franchiseModifiers = {};
        if (movie.franchiseId) {
            franchiseDoc = await Franchise.findById(movie.franchiseId).session(session);
            if (franchiseDoc) {
                franchiseModifiers = {
                    fanMultiplier: franchiseDoc.fanbaseMultiplier || 1,
                    prestigeBonus: franchiseDoc.prestigeBonus || 0,
                };
            }
        }

        // 3. Update Studio Growth (Money handled here, Fans/Prestige inside)
        const growth = processStudioGrowth(gameState, studio, movie, franchiseModifiers);

        // Franchise reputation (write): fold this installment's outcome into the
        // franchise's lifetime revenue and accumulated fanbase/prestige. Persisted
        // with the same session below so it rolls back atomically with the release.
        if (franchiseDoc) {
            const progress = computeFranchiseProgress(franchiseDoc, movie);
            franchiseDoc.fanbaseMultiplier = progress.fanbaseMultiplier;
            franchiseDoc.prestigeBonus = progress.prestigeBonus;
            franchiseDoc.totalRevenue = progress.totalRevenue;
        }

        // 4. Update Careers
        processCareerImpact(gameState, movie, writer, director, leadActor, crewTeam);

        // 5. Release Talent (Set back to AVAILABLE)
        if (director) {
            director.status = "AVAILABLE";
            director.busyUntilWeek = null;
        }
        if (leadActor) {
            leadActor.status = "AVAILABLE";
            leadActor.busyUntilWeek = null;
        }
        if (crewTeam) {
            crewTeam.status = "AVAILABLE";
            crewTeam.busyUntilWeek = null;
        }
        // Supporting Actors
        if (movie.supportingActorIds && movie.supportingActorIds.length > 0) {
            movie.supportingActorIds.forEach(actorId => {
                const sActor = gameState.ownedActors.find(a => a.id === actorId);
                if (sActor) {
                    sActor.status = "AVAILABLE";
                    sActor.busyUntilWeek = null;
                }
            });
        }

        // 6. Finalize Movie Status
        movie.status = "RELEASED";
        movie.releaseWeek = gameState.currentWeek;

        // Move to history in GameState if needed
        if (!gameState.movieHistory) gameState.movieHistory = [];
        gameState.movieHistory.push(movie._id);

        // Remove from active movies
        gameState.activeMovies = gameState.activeMovies.filter(mId => mId.toString() !== movie._id.toString());

        // Notifications
        addNotification(gameState, `"${movie.title}" released! Critic Score: ${movie.criticScore} (${movie.criticLabel})`);
        addNotification(gameState, `"${movie.title}" earned ₹${movie.worldwideGross.toLocaleString()} worldwide. Verdict: ${movie.verdict}`);

        // Generate news article for the release
        await generateNewsFromRelease(movie, studio, gameState.currentWeek);

        // Surface the market climate's effect when it was material.
        if (marketMultiplier > 1.01) {
            const matched = activeTrends.find((t) => (script?.genres || []).includes(t.genre));
            addNotification(
                gameState,
                `Market boost: the "${matched ? matched.label : "current trend"}" lifted "${movie.title}" at the box office.`
            );
        } else if (marketMultiplier < 0.99) {
            const matched = activeTrends.find((t) => (script?.genres || []).includes(t.genre));
            addNotification(
                gameState,
                `Market headwind: "${matched ? matched.label : "current trend"}" dampened "${movie.title}" at the box office.`
            );
        }

            await movie.save({ session });
            await studio.save({ session });
            await gameState.save({ session });
            if (franchiseDoc) await franchiseDoc.save({ session });

            return { movie, growth };
        });

        res.status(200).json({ success: true, movie: result.movie, growth: result.growth });
    } catch (error) {
        logger.error("Release Movie Error", { error: error.message, movieId: id });
        res.status(500).json({ success: false, message: `Operation rolled back due to: ${error.message}` });
    }
};

export const getReleasedMovies = async (req, res) => {
    try {
        const studio = await Studio.findOne({ owner: req.user._id }).select("_id").lean();
        if (!studio) return res.status(404).json({ success: false, message: "Studio not found" });

        const gameState = await GameState.findOne({ user: req.user._id }).lean();

        const movies = await Movie.find({ studioId: studio._id, status: "RELEASED" })
            .sort({ createdAt: -1 })
            .lean();

        if (gameState) {
            await lazyBackfillNames(movies, gameState);
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
            await lazyBackfillNames([movie], gameState);
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

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const movie = await Movie.findOne({ _id: id, studioId: studio._id });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    if (movie.status === "RELEASED" || movie.status === "RELEASED_STREAMING") {
      return res.status(400).json({ success: false, message: "Cannot add marketing to a released movie" });
    }

    const campaign = MARKETING_CAMPAIGNS.find(c => c.id === campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign type not found" });
    }

    if (movie.marketingCampaigns.includes(campaignId)) {
      return res.status(400).json({ success: false, message: "This campaign is already active for this movie" });
    }

    if (studio.money < campaign.cost) {
      return res.status(400).json({ success: false, message: "Insufficient funds for this campaign" });
    }

    const gameState = await GameState.findOne({ user: req.user._id });
    const script = gameState?.ownedScripts?.find(s => s.id === movie.scriptId) || 
                   gameState?.marketScripts?.find(s => s.id === movie.scriptId);
    
    const genres = script?.genres || [];
    const effectiveHype = getEffectiveHypeBoost(campaign, genres);

    movie.marketingCampaigns.push(campaignId);
    movie.marketingBudget += campaign.cost;
    movie.hype = Math.min(100, movie.hype + effectiveHype);

    studio.money -= campaign.cost;

    await movie.save();
    await studio.save();

    res.status(200).json({
      success: true,
      message: `Successfully launched ${campaign.name} for "${movie.title}"! Hype increased by +${effectiveHype}`,
      movie,
      studioMoney: studio.money
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
