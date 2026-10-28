const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const FESTIVAL_PROFILES = {
  CANNES: {
    name: "CANNES",
    label: "Cannes Film Festival",
    entryFee: 500000,
    topAward: "PALME_D_OR",
    prestige: "A-List International",
    weighting: {
      direction: 0.35,
      screenplay: 0.25,
      performances: 0.25,
      thematicDepth: 0.15,
    },
    juryBias: "Auteur prestige and formal daring",
  },
  VENICE: {
    name: "VENICE",
    label: "Venice International Film Festival",
    entryFee: 400000,
    topAward: "GOLDEN_LION",
    prestige: "A-List International",
    weighting: {
      direction: 0.3,
      screenplay: 0.2,
      performances: 0.3,
      thematicDepth: 0.2,
    },
    juryBias: "Cinematic sophistication and visual ambition",
  },
  TIFF: {
    name: "TIFF",
    label: "Toronto International Film Festival",
    entryFee: 300000,
    topAward: "PEOPLES_CHOICE",
    prestige: "Major Audience Catalyst",
    weighting: {
      direction: 0.2,
      screenplay: 0.25,
      performances: 0.35,
      thematicDepth: 0.2,
    },
    juryBias: "Audience momentum and breakthrough appeal",
  },
  SUNDANCE: {
    name: "SUNDANCE",
    label: "Sundance Film Festival",
    entryFee: 250000,
    topAward: "GRAND_JURY_PRIZE",
    prestige: "Indie Premiere Hub",
    weighting: {
      direction: 0.25,
      screenplay: 0.35,
      performances: 0.2,
      thematicDepth: 0.2,
    },
    juryBias: "Originality, voice, and discovery",
  },
};

export const getFestivalProfile = (festivalName = "CANNES") => {
  return FESTIVAL_PROFILES[festivalName] || FESTIVAL_PROFILES.CANNES;
};

const buildPillars = (movie, profile) => {
  const quality = toNumber(movie?.quality, 60);
  const criticScore = toNumber(movie?.criticScore, 60);
  const audienceScore = toNumber(movie?.audienceScore, 60);
  const hype = toNumber(movie?.hype, 60);
  const direction = clamp((quality * 0.45) + (criticScore * 0.35) + (hype * 0.2), 0, 100);
  const screenplay = clamp((criticScore * 0.55) + (quality * 0.25) + (audienceScore * 0.2), 0, 100);
  const performances = clamp((audienceScore * 0.45) + (quality * 0.3) + (hype * 0.25), 0, 100);
  const thematicDepth = clamp((criticScore * 0.4) + (hype * 0.25) + (quality * 0.35), 0, 100);

  const weightedTotal =
    direction * profile.weighting.direction +
    screenplay * profile.weighting.screenplay +
    performances * profile.weighting.performances +
    thematicDepth * profile.weighting.thematicDepth;

  return {
    direction: Number(direction.toFixed(1)),
    screenplay: Number(screenplay.toFixed(1)),
    performances: Number(performances.toFixed(1)),
    thematicDepth: Number(thematicDepth.toFixed(1)),
    totalScore: Number(Math.min(100, Math.max(0, weightedTotal)).toFixed(1)),
  };
};

export const generateFestivalDeliberation = (movie = {}, festivalName = "CANNES") => {
  const profile = getFestivalProfile(festivalName);
  const pillars = buildPillars(movie, profile);
  const totalScore = pillars.totalScore;

  let intensity = "polite";
  if (totalScore >= 88) intensity = "thunderous";
  else if (totalScore >= 75) intensity = "warm";
  else if (totalScore >= 60) intensity = "respectful";
  else if (totalScore >= 45) intensity = "measured";

  const standingOvation = {
    durationSeconds: Math.max(12, Math.round(20 + totalScore * 1.2 + (toNumber(movie?.hype, 50) * 0.5))),
    intensity,
    reaction: intensity === "thunderous"
      ? "The room erupts in a full standing ovation that refuses to end."
      : intensity === "warm"
        ? "The festival crowd rises in a sustained burst of appreciation."
        : intensity === "respectful"
          ? "The audience responds with a steady, admiring ovation."
          : "The screening earns a polite but cautious response."
  };

  const quotes = {
    elite: [
      "A film that feels like a major statement from the first frame to the last.",
      "The craft is immaculate, and the emotional resonance feels unmistakably singular.",
      "A deeply persuasive work of cinema with an unmistakable festival pulse.",
      "The film balances ambition and emotional honesty with rare precision.",
    ],
    mixed: [
      "A promising work with moments of brilliance that deserve a second look.",
      "The ambitions are clear, even if the final pass could sharpen the edges.",
      "A thoughtful film with clear artistic intent and a few rough transitions.",
      "It commands attention, though its impact is uneven in the middle stretch.",
    ],
  };

  const juryConsensusQuote = totalScore >= 75
    ? quotes.elite[Math.floor((totalScore + (festivalName.length * 3)) % quotes.elite.length)]
    : quotes.mixed[Math.floor((totalScore + festivalName.length) % quotes.mixed.length)];

  return {
    festivalName: profile.name,
    filmProfile: profile,
    pillars: {
      direction: pillars.direction,
      screenplay: pillars.screenplay,
      performances: pillars.performances,
      thematicDepth: pillars.thematicDepth,
    },
    totalScore,
    standingOvation,
    juryConsensusQuote,
    verdict: totalScore >= 85 ? "AWARDED" : totalScore >= 65 ? "ACCEPTED" : totalScore >= 45 ? "MIXED" : "REJECTED",
  };
};

export const generateDistributorBids = (movie = {}, festivalName = "CANNES", juryScore = 75) => {
  const profile = getFestivalProfile(festivalName);
  const budget = toNumber(movie?.budget, 20000000);
  const score = clamp(toNumber(juryScore, 75), 0, 100);
  const baseMultiple = 0.42 + (score / 100) * 0.7;
  const bidders = [
    { distributor: "Netflix", weight: 1.22, note: "Global streamer seeking prestige breakout title." },
    { distributor: "A24", weight: 1.18, note: "Awards-season buyer with strong arthouse appetite." },
    { distributor: "Focus Features", weight: 1.1, note: "Prestige theatrical buyer with strong festival pedigree." },
    { distributor: "Lionsgate", weight: 1.05, note: "Commercial crossover play for a broad theatrical run." },
  ];

  const bids = bidders.map((bidder, index) => {
    const amount = Math.max(
      1500000,
      Math.round(budget * (baseMultiple + index * 0.05) * bidder.weight) 
    );

    return {
      distributor: bidder.distributor,
      amount,
      advance: Math.round(amount * 0.32),
      note: bidder.note,
      status: "PENDING",
      festival: profile.name,
    };
  });

  return bids.sort((a, b) => b.amount - a.amount);
};

export const calculateFestivalJuryScore = (movie, festivalName = "CANNES") => {
  const profile = getFestivalProfile(festivalName);
  const quality = toNumber(movie?.quality, 60);
  const criticScore = toNumber(movie?.criticScore, 60);
  const audienceScore = toNumber(movie?.audienceScore, 60);
  const hype = toNumber(movie?.hype, 60);

  const base =
    quality * profile.weighting.direction +
    criticScore * profile.weighting.screenplay +
    audienceScore * profile.weighting.performances +
    hype * profile.weighting.thematicDepth;

  return Math.round(Math.min(100, base));
};

export default {
  FESTIVAL_PROFILES,
  getFestivalProfile,
  generateFestivalDeliberation,
  generateDistributorBids,
  calculateFestivalJuryScore,
};
