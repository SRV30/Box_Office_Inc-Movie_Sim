import Movie from "../models/Movie.js";
import GameState from "../models/GameState.js";
import Studio from "../models/Studio.js";
import Notification from "../models/Notification.js";
import { generateReviews } from "../services/simulation/engines/reviewEngine.js";

const findGameState = async (userId) => GameState.findOne({ user: userId });

/**
 * Conduct a test screening for a movie in post-production.
 * POST /api/movies/:id/test-screening
 */
export const holdTestScreening = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    if (String(movie.studioId) !== String(studio._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to hold test screenings for this movie",
      });
    }

    if (movie.status !== "POST_PRODUCTION") {
      return res.status(400).json({
        success: false,
        message: "Test screenings can only be held during post-production.",
      });
    }

    const gameState = await findGameState(req.user._id);
    if (!gameState) {
      return res.status(404).json({ success: false, message: "Game state not found" });
    }

    const screeningCost = 50000;
    if (studio.money < screeningCost) {
      return res.status(400).json({ success: false, message: "Insufficient funds for test screening." });
    }

    studio.money -= screeningCost;

    // Resolve talent
    const script = gameState.ownedScripts.find((s) => s.id === movie.scriptId) ||
                   gameState.marketScripts.find((s) => s.id === movie.scriptId);
    const director = gameState.ownedDirectors.find((d) => d.id === movie.directorId);
    const leadActor = gameState.ownedActors.find((a) => a.id === movie.leadActorId);
    const crewTeam = gameState.ownedCrewTeams.find((c) => c.id === movie.crewTeamId);

    const projectedReviews = generateReviews(movie, script, director, leadActor, crewTeam);
    const projectedScore = Math.round((projectedReviews.criticScore + projectedReviews.audienceScore) / 2);

    // Apply random noise of -5 to +5 for projection variability
    const noise = Math.floor(Math.random() * 11) - 5;
    const finalProjectedScore = Math.min(100, Math.max(0, projectedScore + noise));

    movie.testScreeningScore = finalProjectedScore;
    
    await Notification.create({
      gameStateId: gameState._id,
      message: `Held test screening for "${movie.title}". Score: ${finalProjectedScore}/100.`,
      createdAt: new Date(),
    });

    await movie.save();
    await studio.save();

    res.status(200).json({
      success: true,
      projectedScore: finalProjectedScore,
      movie,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Order reshoots/script-doctoring to boost movie quality.
 * POST /api/movies/:id/reshoots
 */
export const orderReshoots = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    if (String(movie.studioId) !== String(studio._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to order reshoots for this movie",
      });
    }

    if (movie.status !== "POST_PRODUCTION") {
      return res.status(400).json({
        success: false,
        message: "Reshoots can only be ordered during post-production.",
      });
    }

    const gameState = await findGameState(req.user._id);
    if (!gameState) {
      return res.status(404).json({ success: false, message: "Game state or studio not found" });
    }

    const reshootCost = Math.max(200000, Math.round(movie.budget * 0.15));
    if (studio.money < reshootCost) {
      return res.status(400).json({ success: false, message: "Insufficient funds for reshoots." });
    }

    studio.money -= reshootCost;
    movie.reshoots = (movie.reshoots || 0) + 1;
    
    // Defer progress by subtracting 2 weeks from weeksInStage
    movie.weeksInStage -= 2;

    // Recalculate remainingWeeks
    const currentCompleted = 14; // PRE_PRODUCTION (4) + PRODUCTION (10)
    const totalTarget = 20;
    const currentAbsoluteWeeks = currentCompleted + movie.weeksInStage;
    movie.remainingWeeks = Math.max(0, totalTarget - currentAbsoluteWeeks);

    // Boost movie quality by 3-8 points
    const qualityBoost = Math.floor(Math.random() * 6) + 3;
    movie.quality = Math.min(100, movie.quality + qualityBoost);

    // Update busyUntilWeek for all attached talent on GameState
    const director = gameState.ownedDirectors.find((d) => d.id === movie.directorId);
    const leadActor = gameState.ownedActors.find((a) => a.id === movie.leadActorId);
    const crewTeam = gameState.ownedCrewTeams.find((c) => c.id === movie.crewTeamId);

    if (director && director.busyUntilWeek) director.busyUntilWeek += 2;
    if (leadActor && leadActor.busyUntilWeek) leadActor.busyUntilWeek += 2;
    if (crewTeam && crewTeam.busyUntilWeek) crewTeam.busyUntilWeek += 2;

    if (movie.supportingActorIds) {
      movie.supportingActorIds.forEach((actorId) => {
        const act = gameState.ownedActors.find((a) => a.id === actorId);
        if (act && act.busyUntilWeek) act.busyUntilWeek += 2;
      });
    }

    await Notification.create({
      gameStateId: gameState._id,
      message: `Ordered reshoots for "${movie.title}". Quality improved by +${qualityBoost}, production extended by 2 weeks.`,
      createdAt: new Date(),
    });

    await movie.save();
    await studio.save();
    await gameState.save();

    res.status(200).json({
      success: true,
      message: `Reshoots completed! Movie quality increased by +${qualityBoost}.`,
      movie,
      cost: reshootCost,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
