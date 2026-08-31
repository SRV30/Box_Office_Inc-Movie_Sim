/**
 * Constants for the dynamic entertainment news and media engine (issue #543).
 */

export const NEWS_CATEGORIES = {
  BOX_OFFICE: "box_office",
  REVIEW: "review",
  AWARD: "award",
  RELEASE: "release",
  TREND: "trend",
  EVENT: "event",
  RIVALRY: "rivalry",
  SCANDAL: "scandal",
  RELATIONSHIP: "relationship",
  CELEBRITY: "celebrity",
  STREAMING: "streaming",
  TV: "tv",
  FRANCHISE: "franchise",
  BUSINESS: "business",
  SOCIAL: "social",
};

export const NEWS_REGIONS = {
  DOMESTIC: "DOMESTIC",
  INTERNATIONAL: "INTERNATIONAL",
  GLOBAL: "GLOBAL",
};

export const NEWS_SENTIMENTS = {
  POSITIVE: "positive",
  NEGATIVE: "negative",
  NEUTRAL: "neutral",
};

export const NEWS_SOURCES = {
  HOLLYWOOD_REPORTER: { id: "HOLLYWOOD_REPORTER", name: "Hollywood Reporter", credibility: 85 },
  VARIETY: { id: "VARIETY", name: "Variety", credibility: 82 },
  DEADLINE: { id: "DEADLINE", name: "Deadline", credibility: 78 },
  TRADES_DAILY: { id: "TRADES_DAILY", name: "Trades Daily", credibility: 70 },
  CINEVERSE_WIRE: { id: "CINEVERSE_WIRE", name: "CineVerse Wire", credibility: 65 },
  GOSSIP_HOUR: { id: "GOSSIP_HOUR", name: "Gossip Hour", credibility: 40 },
  SOCIAL_BUZZ: { id: "SOCIAL_BUZZ", name: "Social Buzz", credibility: 35 },
  DEFAULT: { id: "CINEVERSE_WIRE", name: "CineVerse Wire", credibility: 65 },
};

/**
 * Headline/body templates keyed by category and template id.
 * Placeholders: {title}, {studio}, {genre}, {gross}, {budget}, {verdict},
 * {criticScore}, {talentA}, {talentB}, {platform}, {year}, {description}
 */
export const NEWS_TEMPLATES = {
  [NEWS_CATEGORIES.BOX_OFFICE]: {
    blockbuster: {
      headline: "HISTORIC RUN: \"{title}\" Shatters Expectations!",
      body: "\"{title}\", the latest blockbuster from {studio}, has taken the industry by storm, grossing a massive ₹{gross} worldwide. Analysts are calling it one of the most successful releases this season!",
      sentiment: NEWS_SENTIMENTS.POSITIVE,
      sourceId: "VARIETY",
      reach: 90,
    },
    hit: {
      headline: "SUCCESS: \"{title}\" Reels in Big Audiences",
      body: "With strong reviews and solid word of mouth, {studio}'s \"{title}\" secures a certified HIT verdict, grossing ₹{gross} worldwide against a budget of ₹{budget}.",
      sentiment: NEWS_SENTIMENTS.POSITIVE,
      sourceId: "HOLLYWOOD_REPORTER",
      reach: 75,
    },
    average: {
      headline: "STEADY: \"{title}\" Finds Moderate Success",
      body: "\"{title}\" from {studio} completes its theatrical run with an AVERAGE verdict, grossing ₹{gross} worldwide.",
      sentiment: NEWS_SENTIMENTS.NEUTRAL,
      sourceId: "TRADES_DAILY",
      reach: 50,
    },
    flop: {
      headline: "DISAPPOINTMENT: \"{title}\" Underperforms at Box Office",
      body: "Despite high marketing efforts, \"{title}\" from {studio} finished as a FLOP, grossing only ₹{gross}.",
      sentiment: NEWS_SENTIMENTS.NEGATIVE,
      sourceId: "DEADLINE",
      reach: 65,
    },
    disaster: {
      headline: "BOX OFFICE DISASTER: \"{title}\" Flops Spectacularly",
      body: "Industry analysts are shocked as {studio}'s \"{title}\" collapses, grossing a mere ₹{gross} worldwide.",
      sentiment: NEWS_SENTIMENTS.NEGATIVE,
      sourceId: "DEADLINE",
      reach: 80,
    },
  },
  [NEWS_CATEGORIES.REVIEW]: {
    rave: {
      headline: "CRITICS RAVE: \"{title}\" Earns {criticScore}/100",
      body: "Reviewers praise {studio}'s \"{title}\" as a must-see, citing standout performances and sharp direction.",
      sentiment: NEWS_SENTIMENTS.POSITIVE,
      sourceId: "HOLLYWOOD_REPORTER",
      reach: 70,
    },
    mixed: {
      headline: "Mixed Reviews for \"{title}\"",
      body: "Critics are divided on {studio}'s \"{title}\", scoring it {criticScore}/100 with praise for ambition but notes on pacing.",
      sentiment: NEWS_SENTIMENTS.NEUTRAL,
      sourceId: "TRADES_DAILY",
      reach: 45,
    },
    pan: {
      headline: "CRITICAL PAN: \"{title}\" Slammed by Reviewers",
      body: "\"{title}\" from {studio} receives harsh reviews at {criticScore}/100, raising concerns ahead of its box office run.",
      sentiment: NEWS_SENTIMENTS.NEGATIVE,
      sourceId: "DEADLINE",
      reach: 60,
    },
  },
  [NEWS_CATEGORIES.TREND]: {
    surge: {
      headline: "TREND ALERT: {genre} Films Surge in Popularity!",
      body: "Audiences cannot get enough of {genre} movies. Analysts predict upcoming {genre} releases will experience a significant box office boost.",
      sentiment: NEWS_SENTIMENTS.POSITIVE,
      sourceId: "VARIETY",
      reach: 55,
    },
  },
  [NEWS_CATEGORIES.SCANDAL]: {
    breaking: {
      headline: "SCANDAL: {studio} Faces Public Backlash",
      body: "{description} Industry insiders say the studio's reputation may take a hit as the story spreads across media outlets.",
      sentiment: NEWS_SENTIMENTS.NEGATIVE,
      sourceId: "GOSSIP_HOUR",
      reach: 70,
    },
  },
  [NEWS_CATEGORIES.RELATIONSHIP]: {
    conflict: {
      headline: "ON-SET DRAMA: {talentA} and {talentB} Clash",
      body: "{description}",
      sentiment: NEWS_SENTIMENTS.NEGATIVE,
      sourceId: "GOSSIP_HOUR",
      reach: 55,
    },
    romance: {
      headline: "CELEBRITY BUZZ: {talentA} and {talentB} Spark Rumors",
      body: "Fans are buzzing about off-screen chemistry between {talentA} and {talentB}. {description}",
      sentiment: NEWS_SENTIMENTS.POSITIVE,
      sourceId: "SOCIAL_BUZZ",
      reach: 60,
    },
  },
  [NEWS_CATEGORIES.AWARD]: {
    winner: {
      headline: "AWARDS: \"{title}\" Takes Best Picture",
      body: "At the Year {year} ceremony, \"{title}\" from {studio} wins Best Picture, cementing its place in cinema history.",
      sentiment: NEWS_SENTIMENTS.POSITIVE,
      sourceId: "HOLLYWOOD_REPORTER",
      reach: 85,
    },
    nominee: {
      headline: "AWARDS SEASON: \"{title}\" Leads Nominees",
      body: "\"{title}\" emerges as a frontrunner at the Year {year} awards, with {studio} celebrating the recognition.",
      sentiment: NEWS_SENTIMENTS.POSITIVE,
      sourceId: "VARIETY",
      reach: 65,
    },
  },
  [NEWS_CATEGORIES.RIVALRY]: {
    release: {
      headline: "COMPETITION: Rival Studio Releases \"{title}\"",
      body: "Competitor \"{studio}\" has released \"{title}\" in the {genre} genre, achieving a {verdict} verdict with ₹{gross} worldwide.",
      sentiment: NEWS_SENTIMENTS.NEUTRAL,
      sourceId: "DEADLINE",
      reach: 50,
    },
  },
  [NEWS_CATEGORIES.EVENT]: {
    scoop: {
      headline: "INDUSTRY SCOOP: {label}",
      body: "{description}",
      sentiment: NEWS_SENTIMENTS.NEUTRAL,
      sourceId: "CINEVERSE_WIRE",
      reach: 40,
    },
  },
  [NEWS_CATEGORIES.FRANCHISE]: {
    milestone: {
      headline: "FRANCHISE UPDATE: \"{title}\" Expands Universe",
      body: "{studio}'s franchise gains momentum as \"{title}\" adds another chapter, boosting fan loyalty across the brand.",
      sentiment: NEWS_SENTIMENTS.POSITIVE,
      sourceId: "VARIETY",
      reach: 60,
    },
  },
  [NEWS_CATEGORIES.STREAMING]: {
    deal: {
      headline: "STREAMING DEAL: \"{title}\" Lands Platform Exclusive",
      body: "{studio} secures a streaming deal for \"{title}\" on {platform}, signaling a shift in distribution strategy.",
      sentiment: NEWS_SENTIMENTS.POSITIVE,
      sourceId: "DEADLINE",
      reach: 55,
    },
  },
  [NEWS_CATEGORIES.SOCIAL]: {
    viral: {
      headline: "SOCIAL MEDIA: {label}",
      body: "{description}",
      sentiment: NEWS_SENTIMENTS.POSITIVE,
      sourceId: "SOCIAL_BUZZ",
      reach: 65,
    },
  },
};

export const fillTemplate = (template, vars = {}) => {
  const replace = (str) =>
    String(str).replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{${key}}`));
  return {
    headline: replace(template.headline),
    body: replace(template.body),
  };
};
