/**
 * Platform-specific audience and engagement models for the V2 social media simulation.
 * Each platform has distinct growth rates, genre affinities, and viral characteristics.
 */

export const SOCIAL_PLATFORMS = {
  INSTAGRAM: "INSTAGRAM",
  TIKTOK: "TIKTOK",
  YOUTUBE: "YOUTUBE",
  X: "X",
};

export const PLATFORM_CONFIG = {
  [SOCIAL_PLATFORMS.INSTAGRAM]: {
    id: SOCIAL_PLATFORMS.INSTAGRAM,
    name: "Instagram",
    baseEngagement: 4.5,
    followerGrowthRate: 0.015,
    viralVariance: 0.3,
    genreAffinity: { Romance: 1.4, Animation: 1.3, Comedy: 1.2 },
    contentTypes: ["BEHIND_SCENES", "INFLUENCER", "AESTHETIC_TEASER"],
    controversyAmplifier: 0.5,
    initialFollowers: 5000,
  },
  [SOCIAL_PLATFORMS.TIKTOK]: {
    id: SOCIAL_PLATFORMS.TIKTOK,
    name: "TikTok",
    baseEngagement: 8.0,
    followerGrowthRate: 0.04,
    viralVariance: 0.8,
    genreAffinity: { Horror: 1.5, Comedy: 1.4, Action: 1.1 },
    contentTypes: ["MEME", "CHALLENGE", "TRAILER_CLIP"],
    controversyAmplifier: 0.6,
    initialFollowers: 2000,
  },
  [SOCIAL_PLATFORMS.YOUTUBE]: {
    id: SOCIAL_PLATFORMS.YOUTUBE,
    name: "YouTube",
    baseEngagement: 3.0,
    followerGrowthRate: 0.008,
    viralVariance: 0.25,
    genreAffinity: { Action: 1.3, "Sci-Fi": 1.3, Drama: 1.2 },
    contentTypes: ["FULL_TRAILER", "BEHIND_SCENES", "REVIEW_REACTION"],
    controversyAmplifier: 0.3,
    initialFollowers: 10000,
  },
  [SOCIAL_PLATFORMS.X]: {
    id: SOCIAL_PLATFORMS.X,
    name: "X",
    baseEngagement: 2.5,
    followerGrowthRate: 0.012,
    viralVariance: 0.5,
    genreAffinity: { Thriller: 1.3, Drama: 1.2 },
    contentTypes: ["HOT_TAKE", "LIVE_REACTION", "HASHTAG"],
    controversyAmplifier: 1.2,
    initialFollowers: 3000,
  },
};

export const SOCIAL_EVENT_TYPES = {
  VIRAL_TRAILER: "VIRAL_TRAILER",
  MEME_TREND: "MEME_TREND",
  FAN_WAR: "FAN_WAR",
  CANCEL_CULTURE: "CANCEL_CULTURE",
  LEAK: "LEAK",
  SPOILER: "SPOILER",
  CELEBRITY_POST: "CELEBRITY_POST",
  HASHTAG_TREND: "HASHTAG_TREND",
  BACKLASH: "BACKLASH",
};

export const SOCIAL_CAMPAIGN_TYPES = {
  TRAILER_PUSH: { id: "TRAILER_PUSH", name: "Trailer Push", cost: 200000, durationWeeks: 3, baseHype: 6 },
  MEME_CAMPAIGN: { id: "MEME_CAMPAIGN", name: "Meme Campaign", cost: 100000, durationWeeks: 2, baseHype: 8 },
  INFLUENCER_BLITZ: { id: "INFLUENCER_BLITZ", name: "Influencer Blitz", cost: 350000, durationWeeks: 4, baseHype: 10 },
  HASHTAG_CHALLENGE: { id: "HASHTAG_CHALLENGE", name: "Hashtag Challenge", cost: 150000, durationWeeks: 2, baseHype: 7 },
  BEHIND_SCENES: { id: "BEHIND_SCENES", name: "Behind the Scenes", cost: 120000, durationWeeks: 3, baseHype: 5 },
};

export const getPlatformGenreMultiplier = (platformId, genres = []) => {
  const config = PLATFORM_CONFIG[platformId];
  if (!config || !Array.isArray(genres) || genres.length === 0) return 1;

  let best = 1;
  for (const genre of genres) {
    const multiplier = config.genreAffinity[genre];
    if (multiplier && multiplier > best) best = multiplier;
  }
  return best;
};
