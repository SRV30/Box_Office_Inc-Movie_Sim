import Movie from "../../models/Movie.js";
import Studio from "../../models/Studio.js";
import Franchise from "../../models/Franchise.js";
import { generateReviews } from "../simulation/engines/reviewEngine.js";
import { generateBoxOffice } from "../simulation/engines/boxOfficeEngine.js";
import { getGenreMultiplier } from "../simulation/engines/trendEngine.js";
import { getDemographicMultiplier } from "../simulation/engines/demographicsEngine.js";
import { processCareerImpact } from "../simulation/engines/careerImpactEngine.js";
import { processStudioGrowth } from "../simulation/engines/studioGrowthEngine.js";
import { computeFranchiseProgress } from "../simulation/engines/franchiseEngine.js";
import { addNotification } from "../simulation/helpers/notificationHelper.js";
import { generateNewsFromRelease } from "../simulation/engines/newsEngine.js";
import { findScriptById } from "./movieValidationService.js";
import { computeClashPenalty } from "../simulation/engines/clashEngine.js";
import { addHistoricRecord } from "../simulation/helpers/historicRecordHelper.js";

/**
 * Handles the complete release process of a movie (manual or scheduled).
 *
 * @param {object} movie
 * @param {object} studio
 * @param {object} gameState
 * @param {object} [session=null]
 * @returns {Promise<object>} { movie, growth }
 */
export const performMovieRelease = async (movie, studio, gameState, session = null) => {
  const script = findScriptById(gameState, movie.scriptId);

  // Find in owned talent
  const director = gameState.ownedDirectors.find(d => d.id === movie.directorId);
  const leadActor = gameState.ownedActors.find(a => a.id === movie.leadActorId);
  const crewTeam = gameState.ownedCrewTeams.find(c => c.id === movie.crewTeamId);

  // Find Writer
  const writer = gameState.ownedWriters.find(w => w.id === script?.writerId);

  // 1. Generate Reviews
  const reviews = generateReviews(movie, script, director, leadActor, crewTeam);
  movie.criticScore = reviews.criticScore;
  movie.criticLabel = reviews.criticLabel;
  movie.audienceScore = reviews.audienceScore;
  movie.audienceLabel = reviews.audienceLabel;

  // Franchise modifiers
  let franchiseDoc = null;
  let franchiseModifiers = {};
  if (movie.franchiseId) {
    franchiseDoc = session
      ? await Franchise.findById(movie.franchiseId).session(session)
      : await Franchise.findById(movie.franchiseId);
    if (franchiseDoc) {
      franchiseModifiers = {
        fanMultiplier: franchiseDoc.fanbaseMultiplier || 1,
        prestigeBonus: franchiseDoc.prestigeBonus || 0,
      };
    }
  }

  // 2. Generate Box Office
  const activeTrends = gameState.marketTrends?.activeTrends || [];
  const marketMultiplier = getGenreMultiplier(activeTrends, script?.genres);
  const demographicMultiplier = getDemographicMultiplier(script?.genres, movie.marketingCampaigns);
  const boxOffice = generateBoxOffice(
    movie,
    leadActor,
    director,
    marketMultiplier,
    demographicMultiplier,
    franchiseDoc
  );
  Object.assign(movie, boxOffice);

  // Apply clash penalty
  const clash = computeClashPenalty(gameState, movie);
  if (clash.boxOfficeMultiplier < 1.0) {
    movie.openingWeekend = Math.round(movie.openingWeekend * clash.boxOfficeMultiplier);
    movie.worldwideGross = Math.round(movie.worldwideGross * clash.boxOfficeMultiplier);
    movie.domesticGross = Math.round(movie.domesticGross * clash.boxOfficeMultiplier);
    movie.internationalGross = Math.round(movie.internationalGross * clash.boxOfficeMultiplier);
    movie.boxOffice = movie.worldwideGross;
    movie.clashPenaltyApplied = true;
    addNotification(gameState, `⚠️ Box Office Clash! "${movie.title}" faced screen-share penalty due to competition from: ${clash.clashedWith.join(", ")}.`);
  }

  // 3. Update Studio Growth
  const growth = processStudioGrowth(gameState, studio, movie, franchiseModifiers);

  // Franchise progress
  if (franchiseDoc) {
    const progress = computeFranchiseProgress(franchiseDoc, movie);
    franchiseDoc.fanbaseMultiplier = progress.fanbaseMultiplier;
    franchiseDoc.prestigeBonus = progress.prestigeBonus;
    franchiseDoc.totalRevenue = progress.totalRevenue;
    franchiseDoc.movieCount = progress.movieCount;
    franchiseDoc.popularity = progress.popularity;
    franchiseDoc.fanLoyalty = progress.fanLoyalty;
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

  if (!gameState.movieHistory) gameState.movieHistory = [];
  gameState.movieHistory.push(movie._id);

  gameState.activeMovies = gameState.activeMovies.filter(mId => mId.toString() !== movie._id.toString());

  // Notifications
  addNotification(gameState, `"${movie.title}" released! Critic Score: ${movie.criticScore} (${movie.criticLabel})`);
  addNotification(gameState, `"${movie.title}" earned ₹${movie.worldwideGross.toLocaleString()} worldwide. Verdict: ${movie.verdict}`);

  // Generate news article for the release
  await generateNewsFromRelease(movie, studio, gameState.currentWeek);

  // Add to historic records
  try {
    await addHistoricRecord({
      title: movie.title,
      studioId: movie.studioId.toString(),
      studioName: studio.name,
      worldwideGross: movie.worldwideGross,
      openingWeekend: movie.openingWeekend,
      roi: movie.roi,
      releaseWeek: movie.releaseWeek,
      isRival: false
    });
  } catch (recordErr) {
    console.error("Failed to save historic record for player", recordErr.message);
  }

  // Save documents
  await movie.save(session ? { session } : undefined);
  if (franchiseDoc) await franchiseDoc.save(session ? { session } : undefined);

  return { movie, growth };
};
