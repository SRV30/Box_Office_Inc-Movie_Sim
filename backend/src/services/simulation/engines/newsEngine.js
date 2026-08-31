/**
 * @fileoverview Dynamic Entertainment News & Media Engine (issue #543)
 *
 * Procedural news generated from simulation events with source/credibility,
 * sentiment, reach, templates, deduplication, and bounded downstream effects.
 */

import NewsItem from "../../../models/NewsItem.js";
import {
  NEWS_CATEGORIES,
  NEWS_REGIONS,
  NEWS_SENTIMENTS,
  NEWS_SOURCES,
  NEWS_TEMPLATES,
  fillTemplate,
} from "../../../constants/newsMedia.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Calculates bounded hype effect from sentiment, reach, and source credibility.
 */
export const calculateHypeEffect = (sentiment, reach = 50, credibility = 65) => {
  const credibilityFactor = credibility / 100;
  const reachFactor = reach / 100;

  if (sentiment === NEWS_SENTIMENTS.POSITIVE) {
    return Number(clamp(reachFactor * credibilityFactor * 5, 0, 5).toFixed(2));
  }
  if (sentiment === NEWS_SENTIMENTS.NEGATIVE) {
    return Number(clamp(-reachFactor * credibilityFactor * 3, -3, 0).toFixed(2));
  }
  return 0;
};

/**
 * Calculates bounded reputation effect from sentiment, reach, and credibility.
 */
export const calculateReputationEffect = (sentiment, reach = 50, credibility = 65) => {
  const credibilityFactor = credibility / 100;
  const reachFactor = reach / 100;

  if (sentiment === NEWS_SENTIMENTS.POSITIVE) {
    return Number(clamp(reachFactor * credibilityFactor * 3, 0, 3).toFixed(2));
  }
  if (sentiment === NEWS_SENTIMENTS.NEGATIVE) {
    return Number(clamp(-reachFactor * credibilityFactor * 8, -8, 0).toFixed(2));
  }
  return 0;
};

/**
 * Applies article effects to studio reputation and movie hype within bounds.
 */
export const applyNewsEffects = (article, studio = null, movie = null) => {
  if (studio && article.reputationEffect) {
    studio.reputation = clamp(
      (studio.reputation ?? 100) + article.reputationEffect,
      0,
      100
    );
  }
  if (movie && article.hypeEffect) {
    movie.hype = clamp((movie.hype ?? 0) + article.hypeEffect, 0, 100);
  }
};

/**
 * Central publish function with deduplication and effect calculation.
 */
export const publishNewsArticle = async ({
  type,
  headline,
  body,
  week,
  studioId = null,
  movieId = null,
  talentId = null,
  franchiseId = null,
  sourceId = "DEFAULT",
  sentiment = NEWS_SENTIMENTS.NEUTRAL,
  reach = 50,
  region = NEWS_REGIONS.GLOBAL,
  dedupeKey = null,
  triggerEvent = "",
  socialAmplified = false,
  entityLinks = [],
  studio = null,
  movie = null,
}) => {
  if (dedupeKey) {
    const existing = await NewsItem.findOne({ dedupeKey });
    if (existing) return existing;
  }

  const source = NEWS_SOURCES[sourceId] || NEWS_SOURCES.DEFAULT;
  const effectiveReach = socialAmplified ? clamp(reach * 1.2, 0, 100) : reach;
  const hypeEffect = calculateHypeEffect(sentiment, effectiveReach, source.credibility);
  const reputationEffect = calculateReputationEffect(sentiment, effectiveReach, source.credibility);

  const article = await NewsItem.create({
    type,
    headline,
    body,
    week,
    publishedWeek: week,
    studioId,
    movieId,
    talentId,
    franchiseId,
    source: { id: source.id, name: source.name, credibility: source.credibility },
    sentiment,
    reach: Number(effectiveReach.toFixed(1)),
    region,
    dedupeKey,
    triggerEvent,
    socialAmplified,
    hypeEffect,
    reputationEffect,
    entityLinks,
  });

  applyNewsEffects(article, studio, movie);

  if (studio?.isModified?.()) await studio.save();
  if (movie?.isModified?.()) await movie.save();

  return article;
};

const verdictTemplateKey = (verdict) => {
  if (verdict === "ALL_TIME_BLOCKBUSTER" || verdict === "BLOCKBUSTER") return "blockbuster";
  if (verdict === "HIT") return "hit";
  if (verdict === "AVERAGE") return "average";
  if (verdict === "FLOP") return "flop";
  return "disaster";
};

const reviewTemplateKey = (criticScore) => {
  if (criticScore >= 75) return "rave";
  if (criticScore >= 50) return "mixed";
  return "pan";
};

/**
 * Generate news article for a movie release (box office + review).
 */
export const generateNewsFromRelease = async (movie, studio, week) => {
  try {
    if (!movie || !studio) return null;

    const vars = {
      title: movie.title,
      studio: studio.name,
      gross: (movie.worldwideGross || 0).toLocaleString("en-IN"),
      budget: (movie.budget || 0).toLocaleString("en-IN"),
      verdict: movie.verdict || "N/A",
      criticScore: movie.criticScore || 0,
    };

    const boxTemplate = NEWS_TEMPLATES[NEWS_CATEGORIES.BOX_OFFICE][verdictTemplateKey(movie.verdict)];
    const boxContent = fillTemplate(boxTemplate, vars);

    const boxArticle = await publishNewsArticle({
      type: NEWS_CATEGORIES.BOX_OFFICE,
      headline: boxContent.headline,
      body: boxContent.body,
      week,
      studioId: studio._id,
      movieId: movie._id,
      sourceId: boxTemplate.sourceId,
      sentiment: boxTemplate.sentiment,
      reach: boxTemplate.reach,
      dedupeKey: `box_office:${movie._id}:${week}`,
      triggerEvent: "MOVIE_RELEASE",
      entityLinks: [
        { entityType: "studio", entityId: String(studio._id), entityName: studio.name },
        { entityType: "movie", entityId: String(movie._id), entityName: movie.title },
      ],
      studio,
      movie,
    });

    const reviewTemplate = NEWS_TEMPLATES[NEWS_CATEGORIES.REVIEW][reviewTemplateKey(movie.criticScore || 0)];
    const reviewContent = fillTemplate(reviewTemplate, vars);

    await publishNewsArticle({
      type: NEWS_CATEGORIES.REVIEW,
      headline: reviewContent.headline,
      body: reviewContent.body,
      week,
      studioId: studio._id,
      movieId: movie._id,
      sourceId: reviewTemplate.sourceId,
      sentiment: reviewTemplate.sentiment,
      reach: reviewTemplate.reach,
      dedupeKey: `review:${movie._id}:${week}`,
      triggerEvent: "MOVIE_REVIEW",
      entityLinks: [
        { entityType: "movie", entityId: String(movie._id), entityName: movie.title },
      ],
      studio,
      movie,
    });

    return boxArticle;
  } catch (error) {
    console.error("Error generating news from release:", error);
    return null;
  }
};

/**
 * Generate news for franchise milestone on release.
 */
export const generateNewsFromFranchise = async (movie, studio, franchise, week) => {
  if (!movie || !studio || !franchise) return null;

  const template = NEWS_TEMPLATES[NEWS_CATEGORIES.FRANCHISE].milestone;
  const content = fillTemplate(template, {
    title: movie.title,
    studio: studio.name,
  });

  return publishNewsArticle({
    type: NEWS_CATEGORIES.FRANCHISE,
    headline: content.headline,
    body: content.body,
    week,
    studioId: studio._id,
    movieId: movie._id,
    franchiseId: franchise._id,
    sourceId: template.sourceId,
    sentiment: template.sentiment,
    reach: template.reach,
    dedupeKey: `franchise:${franchise._id}:${movie._id}:${week}`,
    triggerEvent: "FRANCHISE_RELEASE",
    entityLinks: [
      { entityType: "franchise", entityId: String(franchise._id), entityName: franchise.name || "Franchise" },
      { entityType: "movie", entityId: String(movie._id), entityName: movie.title },
    ],
    studio,
    movie,
  });
};

/**
 * Generate news article for a new market trend.
 */
export const generateNewsFromTrend = async (trend, week) => {
  const template = NEWS_TEMPLATES[NEWS_CATEGORIES.TREND].surge;
  const content = fillTemplate(template, { genre: trend.genre });

  return publishNewsArticle({
    type: NEWS_CATEGORIES.TREND,
    headline: content.headline,
    body: content.body,
    week,
    sourceId: template.sourceId,
    sentiment: template.sentiment,
    reach: template.reach,
    dedupeKey: `trend:${trend.genre}:${week}`,
    triggerEvent: "MARKET_TREND",
    entityLinks: [{ entityType: "genre", entityId: trend.genre, entityName: trend.genre }],
  });
};

/**
 * Generate news article for a fired simulation event.
 */
export const generateNewsFromEvent = async (eventLabel, eventMessage, week, options = {}) => {
  const template = NEWS_TEMPLATES[NEWS_CATEGORIES.EVENT].scoop;
  const content = fillTemplate(template, {
    label: eventLabel,
    description: eventMessage || "Details are sending ripples through the industry.",
  });

  const category = options.category || NEWS_CATEGORIES.EVENT;
  const isSocial = category === NEWS_CATEGORIES.SOCIAL;

  return publishNewsArticle({
    type: isSocial ? NEWS_CATEGORIES.SOCIAL : NEWS_CATEGORIES.EVENT,
    headline: isSocial ? content.headline : content.headline,
    body: content.body,
    week,
    studioId: options.studioId || null,
    movieId: options.movieId || null,
    sourceId: isSocial ? "SOCIAL_BUZZ" : template.sourceId,
    sentiment: options.sentiment || template.sentiment,
    reach: options.reach || (isSocial ? 65 : template.reach),
    dedupeKey: options.dedupeKey || `event:${eventLabel}:${week}`,
    triggerEvent: options.triggerEvent || "SIMULATION_EVENT",
    socialAmplified: isSocial,
    entityLinks: options.entityLinks || [],
    studio: options.studio || null,
    movie: options.movie || null,
  });
};

/**
 * Generate news for a studio scandal.
 */
export const generateNewsFromScandal = async (scandal, studio, week) => {
  const template = NEWS_TEMPLATES[NEWS_CATEGORIES.SCANDAL].breaking;
  const content = fillTemplate(template, {
    studio: studio.name,
    description: scandal.description,
  });

  return publishNewsArticle({
    type: NEWS_CATEGORIES.SCANDAL,
    headline: content.headline,
    body: content.body,
    week,
    studioId: studio._id,
    sourceId: template.sourceId,
    sentiment: template.sentiment,
    reach: template.reach,
    dedupeKey: `scandal:${studio._id}:${scandal.id}:${week}`,
    triggerEvent: "STUDIO_SCANDAL",
    entityLinks: [{ entityType: "studio", entityId: String(studio._id), entityName: studio.name }],
  });
};

/**
 * Generate news for talent relationship drama.
 */
export const generateNewsFromRelationship = async (relationship, message, week, movie = null, studio = null) => {
  const isNegative = ["RIVALRY", "BREAKUP"].includes(relationship.type);
  const templateKey = isNegative ? "conflict" : "romance";
  const template = NEWS_TEMPLATES[NEWS_CATEGORIES.RELATIONSHIP][templateKey];
  const content = fillTemplate(template, {
    talentA: relationship.talentAName || "Star A",
    talentB: relationship.talentBName || "Star B",
    description: message,
  });

  return publishNewsArticle({
    type: NEWS_CATEGORIES.RELATIONSHIP,
    headline: content.headline,
    body: content.body,
    week,
    studioId: studio?._id || null,
    movieId: movie?._id || null,
    talentId: relationship.talentAId,
    sourceId: template.sourceId,
    sentiment: template.sentiment,
    reach: template.reach,
    dedupeKey: `relationship:${relationship.talentAId}:${relationship.talentBId}:${week}:${relationship.type}`,
    triggerEvent: "TALENT_RELATIONSHIP",
    entityLinks: [
      { entityType: "talent", entityId: relationship.talentAId, entityName: relationship.talentAName },
      { entityType: "talent", entityId: relationship.talentBId, entityName: relationship.talentBName },
      ...(movie ? [{ entityType: "movie", entityId: String(movie._id), entityName: movie.title }] : []),
    ],
    studio,
    movie,
  });
};

/**
 * Generate news for annual awards.
 */
export const generateNewsFromAwards = async (bestPicture, studio, year, week, playerWon = false) => {
  const templateKey = playerWon ? "winner" : "nominee";
  const template = NEWS_TEMPLATES[NEWS_CATEGORIES.AWARD][templateKey];
  const content = fillTemplate(template, {
    title: bestPicture.title,
    studio: studio?.name || "Unknown Studio",
    year,
  });

  return publishNewsArticle({
    type: NEWS_CATEGORIES.AWARD,
    headline: content.headline,
    body: content.body,
    week,
    studioId: bestPicture.studioId,
    movieId: bestPicture._id,
    sourceId: template.sourceId,
    sentiment: template.sentiment,
    reach: template.reach,
    dedupeKey: `award:best_picture:${year}`,
    triggerEvent: "ANNUAL_AWARDS",
    entityLinks: [
      { entityType: "movie", entityId: String(bestPicture._id), entityName: bestPicture.title },
    ],
    studio: playerWon ? studio : null,
    movie: playerWon ? bestPicture : null,
  });
};

/**
 * Generate news for a streaming deal.
 */
export const generateNewsFromStreamingDeal = async (movie, studio, platformName, week) => {
  const template = NEWS_TEMPLATES[NEWS_CATEGORIES.STREAMING].deal;
  const content = fillTemplate(template, {
    title: movie.title,
    studio: studio.name,
    platform: platformName,
  });

  return publishNewsArticle({
    type: NEWS_CATEGORIES.STREAMING,
    headline: content.headline,
    body: content.body,
    week,
    studioId: studio._id,
    movieId: movie._id,
    sourceId: template.sourceId,
    sentiment: template.sentiment,
    reach: template.reach,
    dedupeKey: `streaming:${movie._id}:${week}`,
    triggerEvent: "STREAMING_DEAL",
    entityLinks: [
      { entityType: "movie", entityId: String(movie._id), entityName: movie.title },
      { entityType: "platform", entityId: platformName, entityName: platformName },
    ],
    studio,
    movie,
  });
};

/**
 * Generate news article for a rival release.
 */
export const generateNewsFromRivalRelease = async (rivalRelease, week) => {
  const template = NEWS_TEMPLATES[NEWS_CATEGORIES.RIVALRY].release;
  const content = fillTemplate(template, {
    title: rivalRelease.title,
    studio: rivalRelease.studioName,
    genre: rivalRelease.genre,
    verdict: rivalRelease.verdict,
    gross: (rivalRelease.boxOffice || 0).toLocaleString("en-IN"),
  });

  return publishNewsArticle({
    type: NEWS_CATEGORIES.RIVALRY,
    headline: content.headline,
    body: content.body,
    week,
    sourceId: template.sourceId,
    sentiment: template.sentiment,
    reach: template.reach,
    dedupeKey: `rival:${rivalRelease.title}:${week}`,
    triggerEvent: "RIVAL_RELEASE",
    entityLinks: [
      { entityType: "rival_studio", entityId: rivalRelease.studioName, entityName: rivalRelease.studioName },
    ],
  });
};
