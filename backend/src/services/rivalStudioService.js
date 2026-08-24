import RivalStudio from '../models/RivalStudio.js';

const MOVIE_GENRES = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror'];
const RIVAL_NAMES = ['Apex Pictures', 'Vanguard Cinema', 'Horizon Studios', 'Apex Entertainment'];

/**
 * 1. Initialize AI Rival Studios if they don't exist yet
 */
export async function initializeRivalStudios() {
  if (RivalStudio.db?.readyState !== 1) return;
  const existingCount = await RivalStudio.countDocuments();
  if (existingCount === 0) {
    const defaultStudios = RIVAL_NAMES.map((name) => ({
      name,
      budget: Math.floor(Math.random() * 5000000) + 3000000,
      reputation: Math.floor(Math.random() * 30) + 40,
    }));
    await RivalStudio.insertMany(defaultStudios);
  }
}

/**
 * 2. Automated Movie Production (Tick / Simulation Step)
 */
export async function simulateRivalTurn() {
  if (RivalStudio.db?.readyState !== 1) return;
  const rivalStudios = await RivalStudio.find();

  for (let studio of rivalStudios) {
    if (studio.budget >= 1000000) {
      const movieBudget = Math.min(studio.budget * 0.4, 3000000);
      const genre = MOVIE_GENRES[Math.floor(Math.random() * MOVIE_GENRES.length)];
      const title = `${studio.name} Project ${studio.producedMovies.length + 1}`;

      const baseReturn = movieBudget * (0.8 + Math.random() * 0.8);
      const repBonus = (studio.reputation / 100) * movieBudget * 0.3;
      const totalBoxOffice = Math.floor(baseReturn + repBonus);

      studio.budget = studio.budget - movieBudget + totalBoxOffice;
      studio.producedMovies.push({
        title,
        genre,
        budget: movieBudget,
        boxOffice: totalBoxOffice,
      });

      await studio.save();
    }
  }
}

/**
 * 3. Market Competition Logic
 */
export async function calculatePlayerRevenueWithCompetition(playerMovie) {
  const rivals = await RivalStudio.find();
  
  let competingRivalMovies = 0;
  rivals.forEach((studio) => {
    const recentSameGenre = studio.producedMovies.filter(
      (m) => m.genre === playerMovie.genre
    );
    competingRivalMovies += recentSameGenre.length;
  });

  const competitionPenalty = Math.min(competingRivalMovies * 0.1, 0.5);
  const baseRevenue = playerMovie.budget * (1.2 + Math.random() * 0.6);
  
  const finalPlayerRevenue = Math.floor(baseRevenue * (1 - competitionPenalty));
  return { finalPlayerRevenue, competitionPenalty };
}

// Default export object to support default imports across tests
export default {
  initializeRivalStudios,
  simulateRivalTurn,
  calculatePlayerRevenueWithCompetition,
};