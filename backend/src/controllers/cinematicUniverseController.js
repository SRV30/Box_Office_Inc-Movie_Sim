import CinematicUniverse from "../models/CinematicUniverse.js";
import Movie from "../models/Movie.js";
import { calculateUniverseSynergy, updateCinematicUniverseStats } from "../services/cinematicUniverseEngine.js";

export const createCinematicUniverse = async (req, res) => {
  try {
    const { universeName } = req.body;
    const studioId = req.user.studioId || req.user._id;

    const existing = await CinematicUniverse.findOne({ universeName });
    if (existing) {
      return res.status(400).json({ message: "Cinematic universe with this name already exists" });
    }

    const universe = await CinematicUniverse.create({
      studioId,
      universeName,
    });

    return res.status(201).json({ success: true, universe });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addMovieToUniverse = async (req, res) => {
  try {
    const { universeId, movieId } = req.body;
    const studioId = req.user.studioId || req.user._id;

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
    const studioId = req.user.studioId || req.user._id;
    const universes = await CinematicUniverse.find({ studioId }).populate("movies", "title rating boxOfficeTotal poster");
    return res.status(200).json({ success: true, universes });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUniverseSynergyEval = async (req, res) => {
  try {
    const { movieCount, fatigueIndex, isCrossover } = req.query;
    const synergy = calculateUniverseSynergy(
      Number(movieCount || 1),
      Number(fatigueIndex || 0),
      isCrossover === "true"
    );
    return res.status(200).json({ success: true, synergy });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
