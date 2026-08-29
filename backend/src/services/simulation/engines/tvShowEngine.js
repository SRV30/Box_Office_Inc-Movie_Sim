/**
 * @fileoverview TV Show Simulation Engine
 * Handles full season pipelines, episode rating generation, audience retention curves,
 * renewal & cancellation algorithms, syndication eligibility, and talent scheduling conflicts.
 */

export const PRODUCTION_STAGES = [
  "DEVELOPMENT",
  "WRITING",
  "FILMING",
  "POST_PRODUCTION",
  "AIRING",
  "COMPLETED",
];

export const NETWORK_PROFILES = {
  "Broadcast Network": {
    baseViewership: 4.5, // Million viewers
    adRatePerMillion: 125000,
    renewalBudgetMultiplier: 1.1,
    syndicationAffinity: 1.2,
  },
  "Premium Cable": {
    baseViewership: 2.2,
    adRatePerMillion: 250000,
    renewalBudgetMultiplier: 1.2,
    syndicationAffinity: 0.9,
  },
  "Streaming Exclusive": {
    baseViewership: 3.8,
    adRatePerMillion: 160000,
    renewalBudgetMultiplier: 1.15,
    syndicationAffinity: 0.8,
  },
  Syndication: {
    baseViewership: 1.5,
    adRatePerMillion: 90000,
    renewalBudgetMultiplier: 1.0,
    syndicationAffinity: 1.5,
  },
};

/**
 * Calculates overall show quality score (0-100)
 */
export function calculateTVShowQuality(show = {}) {
  const budget = show.budgetPerEpisode || 250000;
  const budgetScore = Math.min(40, Math.round(Math.log10(budget / 10000 + 1) * 12));

  let castBonus = 0;
  if (show.cast && show.cast.length > 0) {
    castBonus = Math.min(30, show.cast.length * 8);
  }

  let writerBonus = 0;
  if (show.writers && show.writers.length > 0) {
    writerBonus = 15;
  }

  let directorBonus = 0;
  if (show.directors && show.directors.length > 0) {
    directorBonus = 15;
  }

  const finalQuality = Math.min(100, Math.max(25, budgetScore + castBonus + writerBonus + directorBonus));
  return finalQuality;
}

/**
 * Simulates a single episode broadcast rating and advertising revenue
 */
export function simulateEpisodeBroadcast(show, season, episodeNumber) {
  const network = NETWORK_PROFILES[show.networkOrPlatform] || NETWORK_PROFILES["Broadcast Network"];
  const quality = show.quality || 50;
  const popularity = show.popularity || 20;

  // Viewership curve: Premiere boost, mid-season stabilization, finale spike
  let episodeMultiplier = 1.0;
  if (episodeNumber === 1) {
    episodeMultiplier = 1.3; // Season Premiere
  } else if (episodeNumber === season.episodesCount) {
    episodeMultiplier = 1.45; // Season Finale
  } else {
    episodeMultiplier = 0.9 + Math.random() * 0.2;
  }

  const baseViewers = network.baseViewership * (1 + popularity / 100);
  const qualityMultiplier = 0.6 + (quality / 100) * 0.8;
  const viewershipRating = Number((baseViewers * qualityMultiplier * episodeMultiplier).toFixed(2));

  // Retention based on quality
  const retention = Math.min(98, Math.max(65, Math.round(75 + (quality - 50) * 0.4)));

  // Ad revenue generated
  const adRevenue = Math.round(viewershipRating * network.adRatePerMillion);

  return {
    episodeNumber,
    title: `Episode ${episodeNumber}`,
    status: "AIRED",
    quality,
    viewershipRating,
    audienceRetention: retention,
    advertisingRevenue: adRevenue,
  };
}

/**
 * Evaluates whether a season warrants renewal or cancellation
 */
export function evaluateSeasonRenewal(show, season) {
  const avgViewership = season.averageViewership || 2.0;
  const costPerEpisode = (season.budget || 1000000) / (season.episodesCount || 8);
  const costInMillions = costPerEpisode / 1000000;

  const criticScore = season.criticScore || 60;
  const audienceScore = season.audienceScore || 65;

  // Efficiency ratio: Viewers per $ Million spent
  const efficiency = avgViewership / Math.max(0.5, costInMillions);

  let score = Math.round(efficiency * 18 + criticScore * 0.25 + audienceScore * 0.35);
  score = Math.min(100, Math.max(10, score));

  let verdict = "CANCELLED";
  let reason = "Ratings fell below network cost-recovery threshold.";

  if (season.seasonNumber >= 6 || (show.totalEpisodesCount || 0) >= 90) {
    verdict = "FINAL_SEASON";
    reason = "Show reached planned creative conclusion; entering lucrative syndication packages.";
  } else if (score >= 55) {
    verdict = "RENEWED";
    reason = "Strong audience retention and profitable advertising yield justified full season renewal.";
  }

  return {
    renewalScore: score,
    renewalVerdict: verdict,
    reason,
  };
}

/**
 * Checks for syndication eligibility (Threshold: >= 80 episodes or >= 5 seasons)
 */
export function checkSyndicationEligibility(show) {
  const totalEpisodes = (show.seasons || []).reduce(
    (sum, s) => sum + (s.episodes?.filter((e) => e.status === "AIRED").length || 0),
    0
  );
  const totalSeasons = (show.seasons || []).length;

  const isEligible = totalEpisodes >= 80 || totalSeasons >= 5;
  const weeklyRoyalty = isEligible
    ? Math.round(totalEpisodes * 1250 * ((show.quality || 50) / 50))
    : 0;

  return {
    syndicationEligible: isEligible,
    weeklySyndicationRoyalty: weeklyRoyalty,
    totalEpisodesAired: totalEpisodes,
  };
}

/**
 * Checks if talent has an active scheduling conflict with TV production
 */
export function checkTalentTVConflict(talentId, activeShows = []) {
  for (const show of activeShows) {
    if (["IN_PRODUCTION", "AIRING"].includes(show.status)) {
      const isCast = (show.cast || []).some(
        (c) => String(c.actorId || c._id) === String(talentId)
      );
      const isDirector = (show.directors || []).some(
        (d) => String(d.directorId || d._id) === String(talentId)
      );
      if (isCast || isDirector) {
        return {
          hasConflict: true,
          showTitle: show.title,
          status: show.status,
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Processes weekly tick for all TV shows in studio
 */
export function processWeeklyTVShows(shows = [], currentWeek = 1) {
  let weeklyAdvertisingRevenue = 0;
  let weeklySyndicationRevenue = 0;
  const updatedShows = [];

  for (const rawShow of shows) {
    const show = { ...rawShow };
    const currentSeason = show.seasons?.[show.seasons.length - 1];

    if (!currentSeason) {
      updatedShows.push(show);
      continue;
    }

    // Advance season production stage
    if (currentSeason.status === "DEVELOPMENT") {
      currentSeason.status = "WRITING";
      show.status = "IN_PRODUCTION";
    } else if (currentSeason.status === "WRITING") {
      currentSeason.status = "FILMING";
    } else if (currentSeason.status === "FILMING") {
      currentSeason.status = "POST_PRODUCTION";
    } else if (currentSeason.status === "POST_PRODUCTION") {
      currentSeason.status = "AIRING";
      currentSeason.currentAiringEpisode = 0;
      show.status = "AIRING";
    } else if (currentSeason.status === "AIRING") {
      const nextEpNum = (currentSeason.currentAiringEpisode || 0) + 1;
      if (nextEpNum <= (currentSeason.episodesCount || 8)) {
        const epData = simulateEpisodeBroadcast(show, currentSeason, nextEpNum);
        currentSeason.episodes = currentSeason.episodes || [];
        currentSeason.episodes.push(epData);
        currentSeason.currentAiringEpisode = nextEpNum;
        currentSeason.advertisingRevenue = (currentSeason.advertisingRevenue || 0) + epData.advertisingRevenue;
        weeklyAdvertisingRevenue += epData.advertisingRevenue;

        // Update season averages
        const airedEps = currentSeason.episodes.filter((e) => e.status === "AIRED");
        const totalViewers = airedEps.reduce((sum, e) => sum + e.viewershipRating, 0);
        currentSeason.averageViewership = Number((totalViewers / airedEps.length).toFixed(2));
      } else {
        // Season Wrap
        currentSeason.status = "COMPLETED";
        const evalOutcome = evaluateSeasonRenewal(show, currentSeason);
        currentSeason.renewalScore = evalOutcome.renewalScore;
        currentSeason.renewalVerdict = evalOutcome.renewalVerdict;
        show.status = evalOutcome.renewalVerdict === "RENEWED" ? "RENEWAL_DECISION" : "COMPLETED";
      }
    }

    // Syndication royalties
    const syndicationStatus = checkSyndicationEligibility(show);
    show.syndicationEligible = syndicationStatus.syndicationEligible;
    if (show.isSyndicated && syndicationStatus.weeklySyndicationRoyalty > 0) {
      weeklySyndicationRevenue += syndicationStatus.weeklySyndicationRoyalty;
      show.totalSyndicationRevenue = (show.totalSyndicationRevenue || 0) + syndicationStatus.weeklySyndicationRoyalty;
    }

    updatedShows.push(show);
  }

  return {
    updatedShows,
    weeklyAdvertisingRevenue,
    weeklySyndicationRevenue,
  };
}
