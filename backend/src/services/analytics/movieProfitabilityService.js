import mongoose from "mongoose";
import Movie from "../../models/Movie.js";
import Studio from "../../models/Studio.js";
import { calculateMovieProfitability } from "../../utils/movieProfitability.js";

/**
 * Retrieves a single movie's canonical profitability report for the
 * authenticated studio owner.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} movieId
 * @returns {Promise<{ movie: object, profitability: object } | null>}
 */
export const getMovieProfitability = async (userId, movieId) => {
  if (!mongoose.isValidObjectId(movieId)) return null;

  const studio = await Studio.findOne({ owner: userId }).select("_id").lean();
  if (!studio) return null;

  const movie = await Movie.findOne({
    _id: movieId,
    studioId: studio._id,
  }).lean();
  if (!movie) return null;

  return {
    movie: {
      _id: movie._id,
      title: movie.title,
      status: movie.status,
      releaseType: movie.releaseType,
    },
    profitability: calculateMovieProfitability(movie),
  };
};

export default { getMovieProfitability };
