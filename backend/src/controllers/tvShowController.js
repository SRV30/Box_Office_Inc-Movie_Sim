import TVShow from "../models/TVShowModel.js";
import Studio from "../models/Studio.js";
import GameState from "../models/GameState.js";
import {
  calculateTVShowQuality,
  simulateEpisodeBroadcast,
  evaluateSeasonRenewal,
  checkSyndicationEligibility,
  checkTalentTVConflict,
} from "../services/simulation/engines/tvShowEngine.js";

/**
 * GET /api/tv-shows
 * Lists the authenticated studio's TV shows, newest first.
 */
export const getTVShows = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const tvShows = await TVShow.find({ studioId: studio._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, tvShows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/tv-shows/:id
 * Returns a single TV show with full seasons and performance stats.
 */
export const getTVShowById = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const tvShow = await TVShow.findById(req.params.id).lean();
    if (!tvShow) {
      return res.status(404).json({ success: false, message: "TV show not found" });
    }

    if (tvShow.studioId.toString() !== studio._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to view this TV show" });
    }

    const syndicationInfo = checkSyndicationEligibility(tvShow);

    res.status(200).json({ success: true, tvShow, syndicationInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/tv-shows
 * Commissions a new TV show for the authenticated studio.
 */
export const createTVShow = async (req, res) => {
  try {
    const {
      title,
      genre = "Drama",
      concept = "Original series",
      networkOrPlatform = "Broadcast Network",
      episodesPerSeason = 8,
      budgetPerEpisode = 250000,
      cast = [],
      writers = [],
      directors = [],
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "TV show title is required" });
    }

    const numericBudgetPerEp = Math.max(50000, Number(budgetPerEpisode) || 250000);
    const numericEpisodes = Math.max(4, Math.min(24, Number(episodesPerSeason) || 8));
    const totalBudget = numericBudgetPerEp * numericEpisodes;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const studioCash = studio.money || studio.cash || 0;
    if (studioCash < totalBudget) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Season 1 production requires $${totalBudget.toLocaleString()} but studio only has $${studioCash.toLocaleString()}.`,
      });
    }

    // Deduct initial season budget
    if (studio.money !== undefined) studio.money -= totalBudget;
    if (studio.cash !== undefined) studio.cash = Math.max(0, studio.cash - totalBudget);
    await studio.save();

    const quality = calculateTVShowQuality({
      budgetPerEpisode: numericBudgetPerEp,
      cast,
      writers,
      directors,
    });

    const initialSeason = {
      seasonNumber: 1,
      episodesCount: numericEpisodes,
      status: "DEVELOPMENT",
      budget: totalBudget,
      episodes: [],
      currentAiringEpisode: 0,
    };

    const tvShow = await TVShow.create({
      studioId: studio._id,
      title: title.trim(),
      genre,
      concept,
      networkOrPlatform,
      status: "DEVELOPMENT",
      totalSeasonsCount: 1,
      totalEpisodesCount: numericEpisodes,
      budgetPerEpisode: numericBudgetPerEp,
      totalBudget,
      quality,
      popularity: 30,
      cast,
      writers,
      directors,
      seasons: [initialSeason],
      createdWeek: 1,
    });

    res.status(201).json({ success: true, message: "TV Show commissioned successfully", tvShow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/tv-shows/:id/renew
 * Renews a TV show for an additional season
 */
export const renewTVShowSeason = async (req, res) => {
  try {
    const { id } = req.params;
    const { episodesCount = 10, budgetPerEpisode } = req.body;

    const tvShow = await TVShow.findById(id);
    if (!tvShow) {
      return res.status(404).json({ success: false, message: "TV show not found" });
    }

    const nextSeasonNumber = (tvShow.seasons?.length || 0) + 1;
    const numBudgetPerEp = Number(budgetPerEpisode) || tvShow.budgetPerEpisode || 300000;
    const totalSeasonCost = numBudgetPerEp * episodesCount;

    const studio = await Studio.findById(tvShow.studioId);
    const studioCash = studio?.money || studio?.cash || 0;

    if (studioCash < totalSeasonCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds for Season ${nextSeasonNumber}. Cost: $${totalSeasonCost.toLocaleString()}`,
      });
    }

    if (studio) {
      if (studio.money !== undefined) studio.money -= totalSeasonCost;
      if (studio.cash !== undefined) studio.cash = Math.max(0, studio.cash - totalSeasonCost);
      await studio.save();
    }

    tvShow.seasons.push({
      seasonNumber: nextSeasonNumber,
      episodesCount,
      status: "DEVELOPMENT",
      budget: totalSeasonCost,
      episodes: [],
      currentAiringEpisode: 0,
    });

    tvShow.totalSeasonsCount = nextSeasonNumber;
    tvShow.totalEpisodesCount = (tvShow.totalEpisodesCount || 0) + episodesCount;
    tvShow.totalBudget = (tvShow.totalBudget || 0) + totalSeasonCost;
    tvShow.status = "IN_PRODUCTION";
    await tvShow.save();

    res.status(200).json({
      success: true,
      message: `Season ${nextSeasonNumber} successfully ordered into production!`,
      tvShow,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/tv-shows/:id/syndicate
 * Packages the completed TV series for domestic & global linear syndication
 */
export const syndicateTVShow = async (req, res) => {
  try {
    const { id } = req.params;
    const tvShow = await TVShow.findById(id);
    if (!tvShow) {
      return res.status(404).json({ success: false, message: "TV show not found" });
    }

    const syndicationStatus = checkSyndicationEligibility(tvShow);
    if (!syndicationStatus.syndicationEligible) {
      return res.status(400).json({
        success: false,
        message: "TV show is not yet eligible for syndication (requires 5+ seasons or 80+ episodes).",
      });
    }

    tvShow.isSyndicated = true;
    tvShow.weeklySyndicationRoyalty = syndicationStatus.weeklySyndicationRoyalty;
    tvShow.status = "SYNDICATED";
    await tvShow.save();

    res.status(200).json({
      success: true,
      message: `TV Show entered syndication! Generating $${syndicationStatus.weeklySyndicationRoyalty.toLocaleString()}/week in passive royalties.`,
      tvShow,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/tv-shows/check-conflict/:talentId
 * Checks for scheduling conflicts for an actor or director
 */
export const checkTalentConflictAPI = async (req, res) => {
  try {
    const { talentId } = req.params;
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const activeShows = await TVShow.find({ studioId: studio._id });
    const conflictResult = checkTalentTVConflict(talentId, activeShows);

    res.status(200).json({ success: true, conflict: conflictResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
