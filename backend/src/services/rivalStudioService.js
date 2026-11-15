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
 * Batches writes using bulkWrite for high-efficiency simulation scaling.
 */
export async function simulateRivalTurn() {
  if (RivalStudio.db?.readyState !== 1) return;
  const rivalStudios = await RivalStudio.find();
  const bulkOps = [];

  for (let studio of rivalStudios) {
    if (studio.budget >= 1000000) {
      const movieBudget = Math.min(studio.budget * 0.4, 3000000);
      const genre = MOVIE_GENRES[Math.floor(Math.random() * MOVIE_GENRES.length)];
      const title = `${studio.name} Project ${studio.producedMovies.length + 1}`;

      const baseReturn = movieBudget * (0.8 + Math.random() * 0.8);
      const repBonus = (studio.reputation / 100) * movieBudget * 0.3;
      const totalBoxOffice = Math.floor(baseReturn + repBonus);

      const newBudget = studio.budget - movieBudget + totalBoxOffice;
      const producedMovie = {
        title,
        genre,
        budget: movieBudget,
        boxOffice: totalBoxOffice,
      };

      bulkOps.push({
        updateOne: {
          filter: { _id: studio._id },
          update: {
            $set: { budget: newBudget },
            $push: { producedMovies: producedMovie },
          },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await RivalStudio.bulkWrite(bulkOps);
  }
}

/**
 * 3. Fetch Rival Studio Intelligence for the player
 */
export async function getRivalStudios() {
  if (RivalStudio.db?.readyState !== 1) return [];
  return await RivalStudio.find().select('name budget reputation producedMovies');
}

/**
 * 4. Sabotage or Spy on a Rival Studio
 */
export async function sabotageRival(rivalId, actionType) {
  if (RivalStudio.db?.readyState !== 1) return null;
  const rival = await RivalStudio.findById(rivalId);
  if (!rival) throw new Error('Rival studio not found');

  if (actionType === 'leak_script') {
    rival.reputation = Math.max(0, rival.reputation - 10);
  } else if (actionType === 'poach_talent') {
    rival.budget = Math.max(0, rival.budget - 500000);
  }

  await rival.save();
  return rival;
}

export default {
  initializeRivalStudios,
  simulateRivalTurn,
  getRivalStudios,
  sabotageRival,
};
