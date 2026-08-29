import StreamingPlatform from "../models/StreamingPlatform.js";
import Studio from "../models/Studio.js";
import Movie from "../models/Movie.js";
import TVShow from "../models/TVShowModel.js";
import {
  calculatePlatformFinancials,
  calculateRecommendationUpgradeCost,
  simulatePlatformWeeklyTick,
} from "../services/simulation/engines/streamingPlatformEngine.js";

/**
 * Lists all active streaming platforms in the entertainment market
 */
export async function getAllPlatforms(req, res, next) {
  try {
    let platforms = await StreamingPlatform.find().sort({ subscribers: -1 });

    // Seed default AI competitor platforms if none exist
    if (platforms.length === 0) {
      platforms = await StreamingPlatform.insertMany([
        {
          name: "StreamFlix Global",
          tagline: "The world's biggest entertainment library.",
          strategy: "BLOCKBUSTER_FOCUSED",
          monthlySubscriptionPrice: 14.99,
          subscribers: 22000000,
          prestigeRating: 80,
          recommendationTechLevel: 6,
          serverBandwidthTier: 4,
          isPlayerPlatform: false,
        },
        {
          name: "PrimeVision Cine",
          tagline: "Original storytelling without boundaries.",
          strategy: "PRESTIGE_FIRST",
          monthlySubscriptionPrice: 11.99,
          subscribers: 14000000,
          prestigeRating: 88,
          recommendationTechLevel: 5,
          serverBandwidthTier: 3,
          isPlayerPlatform: false,
        },
        {
          name: "IndieStream Plus",
          tagline: "Arthouse, festival, and auteur cinema.",
          strategy: "NICHE_INDIE",
          monthlySubscriptionPrice: 5.99,
          subscribers: 3200000,
          prestigeRating: 75,
          recommendationTechLevel: 3,
          serverBandwidthTier: 2,
          isPlayerPlatform: false,
        },
      ]);
    }

    res.status(200).json({ success: true, platforms });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets or fetches the player's studio platform
 */
export async function getMyPlatform(req, res, next) {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    let platform = await StreamingPlatform.findOne({ studioId: studio._id });
    const upgradeCost = platform
      ? calculateRecommendationUpgradeCost(platform.recommendationTechLevel)
      : 0;

    res.status(200).json({ success: true, platform, nextUpgradeCost: upgradeCost });
  } catch (error) {
    next(error);
  }
}

/**
 * Launches a new studio-owned streaming platform
 */
export async function launchPlayerPlatform(req, res, next) {
  try {
    const { name, tagline, strategy = "BALANCED", monthlySubscriptionPrice = 9.99 } = req.body;

    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const existing = await StreamingPlatform.findOne({ studioId: studio._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Studio already operates a streaming platform.",
      });
    }

    const launchCost = 1500000;
    const studioCash = studio.money || studio.cash || 0;
    if (studioCash < launchCost) {
      return res.status(400).json({
        success: false,
        message: `Launching a streaming platform requires $${launchCost.toLocaleString()} in capital infrastructure.`,
      });
    }

    if (studio.money !== undefined) studio.money -= launchCost;
    if (studio.cash !== undefined) studio.cash = Math.max(0, studio.cash - launchCost);
    await studio.save();

    const platform = await StreamingPlatform.create({
      studioId: studio._id,
      name: name?.trim() || `${studio.name} Play`,
      tagline: tagline || "Direct from our studio to your screen.",
      strategy,
      monthlySubscriptionPrice: Number(monthlySubscriptionPrice) || 9.99,
      subscribers: 250000,
      prestigeRating: 50,
      recommendationTechLevel: 1,
      serverBandwidthTier: 1,
      isPlayerPlatform: true,
      historicalSubscribers: [{ week: 1, subscribers: 250000, netProfit: 0 }],
    });

    res.status(201).json({
      success: true,
      message: `${platform.name} successfully launched worldwide!`,
      platform,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates platform pricing and business strategy
 */
export async function updatePlatformConfig(req, res, next) {
  try {
    const { id } = req.params;
    const { monthlySubscriptionPrice, strategy, tagline } = req.body;

    const platform = await StreamingPlatform.findById(id);
    if (!platform) {
      return res.status(404).json({ success: false, message: "Platform not found" });
    }

    if (monthlySubscriptionPrice !== undefined) {
      platform.monthlySubscriptionPrice = Math.max(
        2.99,
        Math.min(29.99, Number(monthlySubscriptionPrice))
      );
    }
    if (strategy) platform.strategy = strategy;
    if (tagline) platform.tagline = tagline;

    await platform.save();

    res.status(200).json({
      success: true,
      message: "Platform parameters updated successfully",
      platform,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Licenses content (Movie or TV show) to the platform catalog
 */
export async function licenseContentToPlatform(req, res, next) {
  try {
    const { id } = req.params;
    const { contentId, contentType = "MOVIE", isExclusive = false } = req.body;

    const platform = await StreamingPlatform.findById(id);
    if (!platform) {
      return res.status(404).json({ success: false, message: "Platform not found" });
    }

    let title = "Original Content";
    let qualityScore = 60;
    let popularityScore = 50;
    let genre = "Drama";

    if (contentType === "MOVIE") {
      const movie = await Movie.findById(contentId);
      if (movie) {
        title = movie.title;
        qualityScore = movie.criticalScore || movie.quality || 60;
        popularityScore = movie.boxOfficeGross ? Math.min(100, Math.round(movie.boxOfficeGross / 5000000)) : 50;
        genre = movie.genre || "Drama";
      }
    } else {
      const tvShow = await TVShow.findById(contentId);
      if (tvShow) {
        title = tvShow.title;
        qualityScore = tvShow.quality || 60;
        popularityScore = tvShow.popularity || 50;
        genre = tvShow.genre || "Drama";
      }
    }

    const weeklyLicensingCost = isExclusive ? 35000 : 15000;

    platform.catalog.push({
      contentId,
      contentType,
      title,
      genre,
      qualityScore,
      popularityScore,
      isExclusive,
      weeklyLicensingCost,
      addedWeek: 1,
      totalWatchHours: 0,
    });

    await platform.save();

    res.status(200).json({
      success: true,
      message: `"${title}" added to ${platform.name} catalog!`,
      platform,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upgrades recommendation algorithms
 */
export async function upgradeRecommendationTech(req, res, next) {
  try {
    const { id } = req.params;
    const platform = await StreamingPlatform.findById(id);
    if (!platform) {
      return res.status(404).json({ success: false, message: "Platform not found" });
    }

    const currentLevel = platform.recommendationTechLevel || 1;
    if (currentLevel >= 10) {
      return res.status(400).json({ success: false, message: "Recommendation engine maxed out!" });
    }

    const cost = calculateRecommendationUpgradeCost(currentLevel);
    const studio = await Studio.findById(platform.studioId);
    const studioCash = studio?.money || studio?.cash || 0;

    if (studioCash < cost) {
      return res.status(400).json({
        success: false,
        message: `Upgrading to Level ${currentLevel + 1} requires $${cost.toLocaleString()}.`,
      });
    }

    if (studio) {
      if (studio.money !== undefined) studio.money -= cost;
      if (studio.cash !== undefined) studio.cash = Math.max(0, studio.cash - cost);
      await studio.save();
    }

    platform.recommendationTechLevel = currentLevel + 1;
    await platform.save();

    res.status(200).json({
      success: true,
      message: `Recommendation algorithm upgraded to Level ${platform.recommendationTechLevel}! Churn reduced.`,
      platform,
    });
  } catch (error) {
    next(error);
  }
}
