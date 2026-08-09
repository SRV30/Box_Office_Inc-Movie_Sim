import CinematicUniverse from "../models/CinematicUniverse.js";
import Movie from "../models/Movie.js";

/**
 * Calculates crossover synergy boost & fatigue penalty for a movie in a cinematic universe
 */
export function calculateUniverseSynergy(movieCount, fatigueIndex, isCrossover) {
  const baseSynergy = Math.min(40, movieCount * 5);
  const crossoverBonus = isCrossover ? 25 : 0;
  const fatiguePenalty = Math.floor(fatigueIndex * 0.3);

  const netSynergyMultiplier = Math.max(0.7, (100 + baseSynergy + crossoverBonus - fatiguePenalty) / 100);
  return { netSynergyMultiplier, baseSynergy, crossoverBonus, fatiguePenalty };
}

/**
 * Recalculates total box office gross and updates fatigue index across active cinematic universes
 */
export async function updateCinematicUniverseStats(universeId) {
  const universe = await CinematicUniverse.findById(universeId).populate("movies");
  if (!universe) return null;

  let totalGross = 0;
  let totalRatingSum = 0;
  const movieCount = universe.movies.length;

  for (const movie of universe.movies) {
    totalGross += movie.boxOfficeTotal || 0;
    totalRatingSum += movie.rating || 50;
  }

  const avgRating = movieCount > 0 ? totalRatingSum / movieCount : 50;
  // Fatigue increases if universe has many movies or low average rating
  const newFatigue = Math.min(100, Math.max(0, Math.round(movieCount * 6 - (avgRating - 50) * 0.5)));

  universe.totalUniverseGross = totalGross;
  universe.sharedFatigueIndex = newFatigue;

  // Advance phase every 5 movies
  universe.phase = Math.floor(movieCount / 5) + 1;

  await universe.save();
  return universe;
}
