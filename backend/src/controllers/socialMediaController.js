import GameState from "../models/GameState.js";
import Studio from "../models/Studio.js";
import Movie from "../models/Movie.js";
import SocialMediaAccount from "../models/SocialMediaAccount.js";
import SocialMediaEvent from "../models/SocialMediaEvent.js";
import {
  ensurePlatformAccounts,
  launchSocialCampaign,
  getSocialBoxOfficeMultiplier,
} from "../services/simulation/engines/socialMediaEngine.js";
import {
  PLATFORM_CONFIG,
  SOCIAL_CAMPAIGN_TYPES,
} from "../constants/socialPlatforms.js";

/**
 * GET /api/social/accounts
 */
export const getSocialAccounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const studio = await Studio.findOne({ owner: userId });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found." });
    }

    const accounts = await ensurePlatformAccounts(userId, studio._id);

    const enriched = accounts.map((acc) => ({
      ...acc.toObject(),
      platformName: PLATFORM_CONFIG[acc.platform]?.name || acc.platform,
    }));

    return res.status(200).json({
      success: true,
      accounts: enriched,
      boxOfficeMultiplier: getSocialBoxOfficeMultiplier(accounts),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/social/accounts/:platform/budget
 */
export const updateSocialBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { platform } = req.params;
    const { weeklyBudget } = req.body;

    const account = await SocialMediaAccount.findOne({ userId, platform });
    if (!account) {
      return res.status(404).json({ success: false, message: "Platform account not found." });
    }

    account.weeklyBudget = weeklyBudget;
    await account.save();

    return res.status(200).json({
      success: true,
      message: `Weekly budget updated for ${PLATFORM_CONFIG[platform]?.name || platform}.`,
      account,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/social/campaigns
 */
export const createSocialCampaign = async (req, res) => {
  try {
    const userId = req.user._id;
    const { platform, movieId, campaignType } = req.body;

    const studio = await Studio.findOne({ owner: userId });
    const gameState = await GameState.findOne({ user: userId });
    if (!studio || !gameState) {
      return res.status(404).json({ success: false, message: "Game state not found." });
    }

    const movie = await Movie.findOne({ _id: movieId, studioId: studio._id });
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found." });
    }

    const { account, campaign } = await launchSocialCampaign({
      userId,
      studioId: studio._id,
      platform,
      movieId: movie._id,
      movieTitle: movie.title,
      campaignType,
      currentWeek: gameState.currentWeek || 1,
      studio,
    });

    return res.status(200).json({
      success: true,
      message: `${campaign.name} launched on ${PLATFORM_CONFIG[platform]?.name || platform} for "${movie.title}".`,
      account,
      campaign,
    });
  } catch (error) {
    const status = error.message.includes("Insufficient") ? 400 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/social/events
 */
export const getSocialEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const events = await SocialMediaEvent.find({ userId })
      .sort({ week: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/social/analytics
 */
export const getSocialAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const accounts = await SocialMediaAccount.find({ userId }).lean();

    const totalFollowers = accounts.reduce((sum, a) => sum + (a.followers || 0), 0);
    const avgEngagement =
      accounts.length > 0
        ? accounts.reduce((sum, a) => sum + (a.engagementRate || 0), 0) / accounts.length
        : 0;
    const totalMomentum = accounts.reduce((sum, a) => sum + (a.viralMomentum || 0), 0);

    const recentEvents = await SocialMediaEvent.find({ userId })
      .sort({ week: -1 })
      .limit(10)
      .lean();

    const positiveEvents = recentEvents.filter((e) => e.sentiment === "positive").length;
    const negativeEvents = recentEvents.filter((e) => e.sentiment === "negative").length;

    return res.status(200).json({
      success: true,
      analytics: {
        totalFollowers,
        avgEngagement: Number(avgEngagement.toFixed(2)),
        totalMomentum: Number(totalMomentum.toFixed(2)),
        boxOfficeMultiplier: getSocialBoxOfficeMultiplier(accounts),
        recentSentiment: { positive: positiveEvents, negative: negativeEvents },
        platforms: accounts.map((a) => ({
          platform: a.platform,
          name: PLATFORM_CONFIG[a.platform]?.name,
          followers: a.followers,
          engagementRate: a.engagementRate,
          viralMomentum: a.viralMomentum,
          activeCampaigns: a.activeCampaigns?.length || 0,
        })),
      },
      campaignTypes: Object.values(SOCIAL_CAMPAIGN_TYPES),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/social/movies
 * Returns active movies eligible for social campaigns.
 */
export const getCampaignEligibleMovies = async (req, res) => {
  try {
    const studio = await Studio.findOne({ owner: req.user._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found." });
    }

    const movies = await Movie.find({
      studioId: studio._id,
      status: { $nin: ["RELEASED", "RELEASED_STREAMING"] },
    })
      .select("title status hype genres")
      .lean();

    return res.status(200).json({ success: true, movies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
