import FranchiseUniverseV2 from "../models/FranchiseUniverseV2.js";
import Studio from "../models/Studio.js";
import Movie from "../models/Movie.js";
import TVShow from "../models/TVShowModel.js";
import {
  validateCanonConsistency,
  calculateFranchiseFatigue,
  calculateUniverseBoxOfficeModifier,
  evaluateCrossMediaSynergy,
  evaluateAIFranchiseExpansion,
} from "../services/simulation/engines/franchiseV2Engine.js";

/**
 * Lists all cinematic universes for the authenticated studio
 */
export async function getStudioUniverses(req, res, next) {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const universes = await FranchiseUniverseV2.find({ studioId: studio._id }).sort({
      totalUniverseGross: -1,
    });

    res.status(200).json({ success: true, universes });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets universe detail by ID with fatigue, canon, and cross-media telemetry
 */
export async function getUniverseById(req, res, next) {
  try {
    const { id } = req.params;
    const universe = await FranchiseUniverseV2.findById(id);
    if (!universe) {
      return res.status(404).json({ success: false, message: "Universe not found" });
    }

    const canonValidation = validateCanonConsistency(universe.canonTimeline);
    const fatigue = calculateFranchiseFatigue(10, universe.canonTimeline, universe.inHiatus);
    const crossMedia = evaluateCrossMediaSynergy(universe.canonTimeline);
    const aiRecommendation = evaluateAIFranchiseExpansion(universe, 10);

    res.status(200).json({
      success: true,
      universe,
      canonValidation,
      fatigue,
      crossMedia,
      aiRecommendation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Creates a new Cinematic Universe entity
 */
export async function createUniverse(req, res, next) {
  try {
    const { universeName, description, tier = "CINEMATIC_UNIVERSE" } = req.body;

    if (!universeName || !universeName.trim()) {
      return res.status(400).json({ success: false, message: "Universe name is required" });
    }

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const universe = await FranchiseUniverseV2.create({
      studioId: studio._id,
      universeName: universeName.trim(),
      description,
      tier,
      loreConsistencyScore: 100,
      fatigueScore: 0,
      universeHypeMultiplier: 1.2,
      fanbaseSize: 1500000,
      fanLoyalty: 80,
      prestigeLevel: 25,
      totalUniverseGross: 0,
      canonTimeline: [],
    });

    res.status(201).json({
      success: true,
      message: `Cinematic Universe "${universe.universeName}" initialized!`,
      universe,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Registers an existing Movie or TV show into the Universe Canon Timeline
 */
export async function addCanonEntry(req, res, next) {
  try {
    const { id } = req.params;
    const {
      entryId,
      entryType = "MOVIE",
      narrativeType = "SEQUEL",
      phase = 1,
      leadWriterRetained = true,
    } = req.body;

    const universe = await FranchiseUniverseV2.findById(id);
    if (!universe) {
      return res.status(404).json({ success: false, message: "Universe not found" });
    }

    let title = "Universe Entry";
    let qualityScore = 65;
    let worldwideGross = 0;

    if (entryType === "MOVIE") {
      const movie = await Movie.findById(entryId);
      if (movie) {
        title = movie.title;
        qualityScore = movie.criticalScore || movie.quality || 65;
        worldwideGross = movie.worldwideGross || 0;
      }
    } else {
      const tvShow = await TVShow.findById(entryId);
      if (tvShow) {
        title = tvShow.title;
        qualityScore = tvShow.quality || 65;
        worldwideGross = tvShow.totalAdvertisingRevenue || 0;
      }
    }

    const nextTimelinePos = (universe.canonTimeline?.length || 0) + 1;

    universe.canonTimeline.push({
      entryId,
      entryType,
      title,
      timelinePosition: nextTimelinePos,
      narrativeType,
      phase,
      releaseWeek: nextTimelinePos * 6,
      qualityScore,
      worldwideGross,
      leadWriterRetained,
    });

    universe.totalEntriesCount = universe.canonTimeline.length;
    universe.totalUniverseGross =
      (universe.totalUniverseGross || 0) + worldwideGross;

    // Recalculate canon consistency and fatigue
    const canonResult = validateCanonConsistency(universe.canonTimeline);
    universe.loreConsistencyScore = canonResult.loreScore;

    const fatigueResult = calculateFranchiseFatigue(
      universe.totalEntriesCount * 6,
      universe.canonTimeline,
      universe.inHiatus
    );
    universe.fatigueScore = fatigueResult.fatigueScore;

    // Fanbase growth
    universe.fanbaseSize += 350000;
    universe.universeHypeMultiplier = Number(
      (universe.universeHypeMultiplier + 0.05).toFixed(2)
    );

    await universe.save();

    res.status(200).json({
      success: true,
      message: `"${title}" officially added to ${universe.universeName} canon timeline!`,
      universe,
      canonValidation: canonResult,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggles hiatus mode to cool off audience fatigue
 */
export async function toggleHiatus(req, res, next) {
  try {
    const { id } = req.params;
    const universe = await FranchiseUniverseV2.findById(id);
    if (!universe) {
      return res.status(404).json({ success: false, message: "Universe not found" });
    }

    universe.inHiatus = !universe.inHiatus;
    if (universe.inHiatus) {
      universe.fatigueScore = Math.max(0, universe.fatigueScore - 30);
    }

    await universe.save();

    res.status(200).json({
      success: true,
      message: universe.inHiatus
        ? `Universe entered creative hiatus. Audience fatigue reducing rapidly.`
        : `Universe resumed active production slate.`,
      universe,
    });
  } catch (error) {
    next(error);
  }
}
