/**
 * @fileoverview Social Media Simulation Engine (issue #534)
 *
 * Simulates Instagram, TikTok, YouTube, and X as distinct platforms with
 * unique audience/engagement models. Generates social events from simulation
 * state, applies bounded hype/reputation effects, and decays momentum weekly.
 */

import SocialMediaAccount from "../../../models/SocialMediaAccount.js";
import SocialMediaEvent from "../../../models/SocialMediaEvent.js";
import TalentRelationship, { RELATIONSHIP_TYPES } from "../../../models/TalentRelationship.js";
import {
  SOCIAL_PLATFORMS,
  PLATFORM_CONFIG,
  SOCIAL_EVENT_TYPES,
  SOCIAL_CAMPAIGN_TYPES,
  getPlatformGenreMultiplier,
} from "../../../constants/socialPlatforms.js";
import { addNotification } from "../helpers/notificationHelper.js";
import { generateNewsFromEvent } from "./newsEngine.js";

const MAX_WEEKLY_METRICS = 52;
const MAX_EVENTS_PER_USER = 100;
const MOMENTUM_DECAY = 0.15;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Deterministic pseudo-random in [0, 1) from a numeric seed.
 */
export const deterministicRandom = (seed) => {
  const x = Math.sin(Number(seed)) * 10000;
  return x - Math.floor(x);
};

/**
 * Creates a seeded RNG function for a given user/week context.
 */
export const createSeededRng = (userId, week, salt = 0) => {
  let counter = 0;
  const baseSeed = String(userId).slice(-6) + week * 997 + salt * 131;
  return () => deterministicRandom(baseSeed + counter++);
};

/**
 * Calculates platform-specific engagement for content given genre affinity.
 */
export const calculatePlatformEngagement = (platformId, genres = [], followerCount = 0, rng = Math.random) => {
  const config = PLATFORM_CONFIG[platformId];
  if (!config) return { engagement: 0, impressions: 0 };

  const genreMultiplier = getPlatformGenreMultiplier(platformId, genres);
  const followerFactor = Math.log10(Math.max(followerCount, 100)) / 5;
  const variance = 1 + (rng() - 0.5) * config.viralVariance;

  const engagement = clamp(
    config.baseEngagement * genreMultiplier * followerFactor * variance,
    0,
    100
  );
  const impressions = Math.floor(followerCount * (engagement / 100) * (1 + rng() * 0.5));

  return {
    engagement: Number(engagement.toFixed(2)),
    impressions,
  };
};

/**
 * Calculates bounded viral hype boost for a movie on a platform.
 */
export const calculateViralHypeBoost = (platformId, movie, account, rng = Math.random) => {
  const config = PLATFORM_CONFIG[platformId];
  if (!config || !movie) return 0;

  const genres = movie.genre ? [movie.genre] : movie.genres || [];
  const genreMultiplier = getPlatformGenreMultiplier(platformId, genres);
  const momentumFactor = 1 + (account.viralMomentum || 0) / 200;
  const followerFactor = Math.min(1.5, Math.log10(Math.max(account.followers, 100)) / 4);

  const baseBoost = 2 + rng() * 4;
  const raw = baseBoost * genreMultiplier * momentumFactor * followerFactor;

  return Number(clamp(raw, 0, 12).toFixed(2));
};

/**
 * Returns a bounded box-office multiplier from accumulated social momentum.
 */
export const getSocialBoxOfficeMultiplier = (accounts = []) => {
  if (!accounts.length) return 1;

  const avgMomentum =
    accounts.reduce((sum, acc) => sum + (acc.viralMomentum || 0), 0) / accounts.length;

  return Number(clamp(1 + avgMomentum / 500, 0.95, 1.15).toFixed(4));
};

/**
 * Initializes all four platform accounts for a user if they don't exist.
 */
export const ensurePlatformAccounts = async (userId, studioId) => {
  const existing = await SocialMediaAccount.find({ userId }).lean();
  const existingPlatforms = new Set(existing.map((a) => a.platform));
  const created = [];

  for (const platformId of Object.values(SOCIAL_PLATFORMS)) {
    if (existingPlatforms.has(platformId)) continue;

    const config = PLATFORM_CONFIG[platformId];
    const account = await SocialMediaAccount.create({
      userId,
      studioId,
      platform: platformId,
      followers: config.initialFollowers,
      engagementRate: config.baseEngagement,
      weeklyBudget: 0,
      viralMomentum: 0,
      activeCampaigns: [],
      weeklyMetrics: [],
    });
    created.push(account);
  }

  return SocialMediaAccount.find({ userId });
};

/**
 * Generates social events from current simulation state.
 */
export const generateSocialEventsFromState = async ({
  userId,
  week,
  studio,
  movies,
  accounts,
  rng = Math.random,
  relationships: relationshipsOverride = null,
}) => {
  const events = [];

  const activeMovies = movies.filter((m) =>
    ["PRE_PRODUCTION", "PRODUCTION", "POST_PRODUCTION", "READY_FOR_RELEASE"].includes(m.status)
  );

  // Positive: viral trailer reaction for high-hype movies
  for (const movie of activeMovies) {
    if ((movie.hype || 0) >= 60 && rng() < 0.12) {
      const platform = accounts[Math.floor(rng() * accounts.length)];
      if (!platform) continue;

      const hypeDelta = Number(clamp(3 + rng() * 5, 1, 10).toFixed(2));
      events.push({
        userId,
        week,
        platform: platform.platform,
        eventType: SOCIAL_EVENT_TYPES.VIRAL_TRAILER,
        sentiment: "positive",
        movieId: movie._id,
        movieTitle: movie.title,
        description: `Trailer for "${movie.title}" is going viral on ${PLATFORM_CONFIG[platform.platform].name}!`,
        hypeDelta,
        reputationDelta: 0,
        viralityScore: Math.floor(60 + rng() * 40),
      });
    }
  }

  // Drama from talent relationships (fan wars, celebrity buzz)
  const relationships =
    relationshipsOverride ??
    (await TalentRelationship.find({
      userId,
      type: { $in: [RELATIONSHIP_TYPES.RIVALRY, RELATIONSHIP_TYPES.ROMANTIC, RELATIONSHIP_TYPES.BREAKUP] },
    })
      .limit(10)
      .lean());

  for (const rel of relationships) {
    if (rng() >= 0.08) continue;

    const isNegative = rel.type === RELATIONSHIP_TYPES.BREAKUP;
    const platformId = rel.type === RELATIONSHIP_TYPES.RIVALRY ? SOCIAL_PLATFORMS.X : SOCIAL_PLATFORMS.INSTAGRAM;
    const eventType =
      rel.type === RELATIONSHIP_TYPES.RIVALRY
        ? SOCIAL_EVENT_TYPES.FAN_WAR
        : rel.type === RELATIONSHIP_TYPES.BREAKUP
          ? SOCIAL_EVENT_TYPES.BACKLASH
          : SOCIAL_EVENT_TYPES.CELEBRITY_POST;

    const linkedMovie = activeMovies.find(
      (m) => m.leadActorId === rel.talentAId || m.leadActorId === rel.talentBId
    );

    events.push({
      userId,
      week,
      platform: platformId,
      eventType,
      sentiment: isNegative ? "negative" : "positive",
      movieId: linkedMovie?._id,
      movieTitle: linkedMovie?.title || "",
      description:
        rel.type === RELATIONSHIP_TYPES.RIVALRY
          ? `Fan war erupts between ${rel.talentAName} and ${rel.talentBName} stans on ${PLATFORM_CONFIG[platformId].name}.`
          : rel.type === RELATIONSHIP_TYPES.BREAKUP
            ? `Breakup gossip about ${rel.talentAName} and ${rel.talentBName} trends on social media.`
            : `${rel.talentAName} and ${rel.talentBName}'s off-screen chemistry sparks fan excitement online.`,
      hypeDelta: isNegative ? 2 : Number(clamp(2 + rng() * 4, 1, 8).toFixed(2)),
      reputationDelta: isNegative ? -5 : 0,
      viralityScore: Math.floor(40 + rng() * 50),
    });
  }

  // Negative: cancel-culture / backlash from low reputation
  if ((studio.reputation || 100) < 70 && rng() < 0.06) {
    const platformId = SOCIAL_PLATFORMS.X;
    events.push({
      userId,
      week,
      platform: platformId,
      eventType: SOCIAL_EVENT_TYPES.CANCEL_CULTURE,
      sentiment: "negative",
      description: "A cancel-culture hashtag targeting your studio is trending on X.",
      hypeDelta: 0,
      reputationDelta: -8,
      viralityScore: Math.floor(50 + rng() * 30),
    });
  }

  // Leaks and spoilers for movies nearing release
  for (const movie of activeMovies.filter((m) => m.status === "READY_FOR_RELEASE")) {
    if (rng() >= 0.05) continue;

    const platformId = rng() < 0.5 ? SOCIAL_PLATFORMS.X : SOCIAL_PLATFORMS.TIKTOK;
    const isSpoiler = rng() < 0.5;

    events.push({
      userId,
      week,
      platform: platformId,
      eventType: isSpoiler ? SOCIAL_EVENT_TYPES.SPOILER : SOCIAL_EVENT_TYPES.LEAK,
      sentiment: "negative",
      movieId: movie._id,
      movieTitle: movie.title,
      description: isSpoiler
        ? `Major spoilers for "${movie.title}" are spreading on ${PLATFORM_CONFIG[platformId].name}.`
        : `Production leak about "${movie.title}" surfaces on ${PLATFORM_CONFIG[platformId].name}.`,
      hypeDelta: isSpoiler ? -3 : 4,
      reputationDelta: isSpoiler ? -3 : 0,
      viralityScore: Math.floor(30 + rng() * 40),
    });
  }

  // Meme trends on TikTok for comedy/horror
  const memeMovie = activeMovies.find((m) => {
    const g = m.genre || (m.genres || [])[0];
    return ["Comedy", "Horror"].includes(g);
  });
  if (memeMovie && rng() < 0.1) {
    events.push({
      userId,
      week,
      platform: SOCIAL_PLATFORMS.TIKTOK,
      eventType: SOCIAL_EVENT_TYPES.MEME_TREND,
      sentiment: "positive",
      movieId: memeMovie._id,
      movieTitle: memeMovie.title,
      description: `A meme trend featuring "${memeMovie.title}" is exploding on TikTok.`,
      hypeDelta: Number(clamp(4 + rng() * 6, 2, 12).toFixed(2)),
      reputationDelta: 0,
      viralityScore: Math.floor(70 + rng() * 30),
    });
  }

  return events;
};

/**
 * Applies generated events to movies, studio reputation, and platform momentum.
 */
export const applySocialEvents = async (events, movies, studio, accounts, gameState) => {
  const movieMap = new Map(movies.map((m) => [String(m._id), m]));
  const accountMap = new Map(accounts.map((a) => [a.platform, a]));
  const savedEvents = [];

  for (const ev of events) {
    if (ev.movieId) {
      const movie = movieMap.get(String(ev.movieId));
      if (movie && ev.hypeDelta) {
        movie.hype = clamp((movie.hype || 0) + ev.hypeDelta, 0, 100);
        await movie.save();
      }
    }

    if (ev.reputationDelta && studio) {
      studio.reputation = clamp((studio.reputation || 100) + ev.reputationDelta, 0, 100);
    }

    const account = accountMap.get(ev.platform);
    if (account) {
      if (ev.sentiment === "positive") {
        account.viralMomentum = clamp((account.viralMomentum || 0) + ev.viralityScore * 0.1, 0, 100);
      } else if (ev.sentiment === "negative") {
        account.viralMomentum = clamp((account.viralMomentum || 0) - ev.viralityScore * 0.05, 0, 100);
        account.followers = Math.max(0, Math.floor((account.followers || 0) * 0.995));
      }
    }

    const saved = await SocialMediaEvent.create(ev);
    savedEvents.push(saved);

    const platformName = PLATFORM_CONFIG[ev.platform]?.name || ev.platform;
    const emoji = ev.sentiment === "negative" ? "📉" : "📱";
    addNotification(gameState, `${emoji} ${platformName}: ${ev.description}`);

    await generateNewsFromEvent(
      `${platformName} Buzz`,
      ev.description,
      ev.week
    );
  }

  return savedEvents;
};

/**
 * Trims old events to keep collection bounded.
 */
export const trimSocialEvents = async (userId) => {
  const count = await SocialMediaEvent.countDocuments({ userId });
  if (count <= MAX_EVENTS_PER_USER) return;

  const excess = count - MAX_EVENTS_PER_USER;
  const oldest = await SocialMediaEvent.find({ userId })
    .sort({ createdAt: 1 })
    .limit(excess)
    .select("_id")
    .lean();

  if (oldest.length > 0) {
    await SocialMediaEvent.deleteMany({ _id: { $in: oldest.map((e) => e._id) } });
  }
};

/**
 * Main weekly social media processing tick.
 */
export const processWeeklySocialMedia = async (gameState, studio, rng = null) => {
  if (!gameState?.user || !studio?._id) return { eventsGenerated: 0, totalSpend: 0 };

  const userId = gameState.user;
  const week = gameState.currentWeek || 1;
  const seededRng = rng || createSeededRng(userId, week);

  const accounts = await ensurePlatformAccounts(userId, studio._id);

  const { default: Movie } = await import("../../../models/Movie.js");
  const movies = await Movie.find({
    studioId: studio._id,
    status: { $nin: ["RELEASED", "RELEASED_STREAMING"] },
  });

  let totalSpend = 0;

  for (const account of accounts) {
    const config = PLATFORM_CONFIG[account.platform];
    const budget = Number(account.weeklyBudget || 0);

    // Deduct weekly platform budget
    if (budget > 0 && (studio.money || 0) >= budget) {
      studio.money = Math.max(0, studio.money - budget);
      totalSpend += budget;

      const growth = Math.floor(budget * config.followerGrowthRate * (0.8 + seededRng() * 0.4));
      account.followers = (account.followers || 0) + growth;
    }

    // Process active campaigns
    account.activeCampaigns = (account.activeCampaigns || []).filter((c) => c.endWeek >= week);

    for (const campaign of account.activeCampaigns || []) {
      const movie = movies.find((m) => String(m._id) === String(campaign.movieId));
      if (!movie) continue;

      const campaignDef = SOCIAL_CAMPAIGN_TYPES[campaign.campaignType];
      if (!campaignDef) continue;

      const hypeBoost = calculateViralHypeBoost(account.platform, movie, account, seededRng);
      movie.hype = clamp((movie.hype || 0) + hypeBoost, 0, 100);
      account.viralMomentum = clamp((account.viralMomentum || 0) + hypeBoost * 0.5, 0, 100);

      const { engagement, impressions } = calculatePlatformEngagement(
        account.platform,
        movie.genre ? [movie.genre] : movie.genres || [],
        account.followers,
        seededRng
      );

      account.weeklyMetrics = account.weeklyMetrics || [];
      account.weeklyMetrics.push({
        week,
        impressions,
        engagement,
        hypeGenerated: hypeBoost,
        sentiment: "positive",
      });

      await movie.save();
    }

    // Decay viral momentum
    account.viralMomentum = clamp(
      (account.viralMomentum || 0) * (1 - MOMENTUM_DECAY),
      0,
      100
    );

    // Cap weekly metrics
    if (account.weeklyMetrics.length > MAX_WEEKLY_METRICS) {
      account.weeklyMetrics = account.weeklyMetrics.slice(-MAX_WEEKLY_METRICS);
    }

    // Update engagement rate from recent metrics
    const recentMetrics = account.weeklyMetrics.slice(-4);
    if (recentMetrics.length > 0) {
      const avgEngagement =
        recentMetrics.reduce((sum, m) => sum + (m.engagement || 0), 0) / recentMetrics.length;
      account.engagementRate = clamp(avgEngagement, 0, 100);
    }

    await account.save();
  }

  // Generate and apply social events from simulation state
  const events = await generateSocialEventsFromState({
    userId,
    week,
    studio,
    movies,
    accounts,
    rng: seededRng,
  });

  if (events.length > 0) {
    await applySocialEvents(events, movies, studio, accounts, gameState);
  }

  await trimSocialEvents(userId);

  if (totalSpend > 0) {
    studio._weeklyMarketingCosts = (studio._weeklyMarketingCosts || 0) + totalSpend;
  }

  return { eventsGenerated: events.length, totalSpend };
};

/**
 * Launches a platform-specific social campaign for a movie.
 */
export const launchSocialCampaign = async ({
  userId,
  studioId,
  platform,
  movieId,
  movieTitle,
  campaignType,
  currentWeek,
  studio,
}) => {
  const campaignDef = SOCIAL_CAMPAIGN_TYPES[campaignType];
  if (!campaignDef) {
    throw new Error("Invalid campaign type.");
  }

  if ((studio.money || 0) < campaignDef.cost) {
    throw new Error("Insufficient funds for this social campaign.");
  }

  const account = await SocialMediaAccount.findOne({ userId, platform });
  if (!account) {
    throw new Error("Platform account not found.");
  }

  studio.money = Math.max(0, studio.money - campaignDef.cost);

  account.activeCampaigns = account.activeCampaigns || [];
  account.activeCampaigns.push({
    movieId,
    movieTitle,
    campaignType,
    startWeek: currentWeek,
    endWeek: currentWeek + campaignDef.durationWeeks,
    spend: campaignDef.cost,
  });

  account.viralMomentum = clamp((account.viralMomentum || 0) + campaignDef.baseHype, 0, 100);

  await account.save();
  await studio.save();

  return { account, campaign: campaignDef };
};

export default processWeeklySocialMedia;
