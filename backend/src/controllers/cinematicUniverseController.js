import CinematicUniverse from "../models/CinematicUniverse.js";
import Movie from "../models/Movie.js";
import Studio from "../models/Studio.js";
import { calculateUniverseSynergy, updateCinematicUniverseStats } from "../services/cinematicUniverseEngine.js";

const resolveStudioId = async (user) => {
  if (user.studioId) return user.studioId;
  const s = await Studio.findOne({ owner: user._id });
  return s?._id || user._id;
};

export const createCinematicUniverse = async (req, res) => {
  try {
    const { universeName } = req.body;
    const studioId = await resolveStudioId(req.user);

    const trimmedName = universeName?.trim();
    if (!trimmedName) {
      return res.status(400).json({ message: "Universe name is required" });
    }

    const existing = await CinematicUniverse.findOne({
      studioId,
      universeName: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({ message: "Cinematic universe with this name already exists in your studio" });
    }

    const universe = await CinematicUniverse.create({
      studioId,
      universeName: trimmedName,
    });

    return res.status(201).json({ success: true, universe });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Cinematic universe with this name already exists in your studio" });
    }
    return res.status(500).json({ message: error.message });
  }
};

export const addMovieToUniverse = async (req, res) => {
  try {
    const { universeId, movieId } = req.body;
    const studioId = await resolveStudioId(req.user);

    const universe = await CinematicUniverse.findOne({ _id: universeId, studioId });
    if (!universe) {
      return res.status(404).json({ message: "Cinematic universe not found" });
    }

    const movie = await Movie.findOne({ _id: movieId, studioId });
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    if (!universe.movies.includes(movieId)) {
      universe.movies.push(movieId);
      await universe.save();
    }

    const updatedUniverse = await updateCinematicUniverseStats(universeId);
    return res.status(200).json({ success: true, universe: updatedUniverse });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getStudioUniverses = async (req, res) => {
  try {
    const studioId = await resolveStudioId(req.user);
    const universes = await CinematicUniverse.find({ studioId }).populate("movies");
    return res.status(200).json({ success: true, universes });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
