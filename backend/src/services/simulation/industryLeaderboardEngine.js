/**
 * @fileoverview Industry Leaderboard & Ranking Service
 *
 * Implements deterministic ranking rules, tie breakers, multi-period aggregations
 * (weekly, monthly, yearly, all-time), indexed/aggregated query engines, and
 * unified Player + AI studio industry rankings.
 */

import Studio from "../../models/Studio.js";
import RivalStudio from "../../models/RivalStudio.js";
import HistoricRecord from "../../models/HistoricRecord.js";
import Movie from "../../models/Movie.js";
import PastAward from "../../models/PastAward.js";

export const RANKING_METRICS = {
  PRESTIGE: "prestige",
  REVENUE: "revenue",
  PROFIT: "profit",
  BOX_OFFICE: "box_office",
  FANS: "fans",
  AWARDS: "awards",
  BLOCKBUSTERS: "blockbusters",
  LEVEL: "level",
};

export const TIME_PERIODS = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
  ALL_TIME: "all_time",
};

/**
 * Normalizes numbers safely to prevent NaN/null issues.
 */
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Deterministic tie-breaker comparator.
 * Primary: Metric Value Descending.
 * Tie-breaker 1: Prestige Descending.
 * Tie-breaker 2: Fans Descending.
 * Tie-breaker 3: Studio Name Ascending (Alphabetical).
 */
export const compareRankings = (a, b) => {
  if (b.metricValue !== a.metricValue) {
    return b.metricValue - a.metricValue;
  }
  if (b.prestige !== a.prestige) {
    return b.prestige - a.prestige;
  }
  if (b.fans !== a.fans) {
    return b.fans - a.fans;
  }
  return String(a.name || "").localeCompare(String(b.name || ""));
};

/**
 * Computes period-filtered metrics for a studio based on financialHistory or seasonStats.
 */
export const extractPeriodStats = (studio, period = TIME_PERIODS.ALL_TIME, currentWeek = 52) => {
  const history = studio.financialHistory || [];
  let minWeek = 1;

  if (period === TIME_PERIODS.WEEKLY) {
    minWeek = Math.max(1, currentWeek);
  } else if (period === TIME_PERIODS.MONTHLY) {
    minWeek = Math.max(1, currentWeek - 4);
  } else if (period === TIME_PERIODS.YEARLY) {
    minWeek = Math.max(1, currentWeek - 52);
  }

  if (period === TIME_PERIODS.ALL_TIME) {
    return {
      revenue: safeNum(studio.stats?.totalRevenue),
      profit: safeNum(studio.stats?.totalProfit),
      boxOffice: safeNum(studio.stats?.totalRevenue),
      awards: safeNum(studio.stats?.awardsWon),
      blockbusters: safeNum(studio.stats?.allTimeBlockbusters || studio.stats?.blockbusters),
    };
  }

  const filteredHistory = history.filter((h) => safeNum(h.week) >= minWeek && safeNum(h.week) <= currentWeek);
  const periodRevenue = filteredHistory.reduce((acc, h) => acc + safeNum(h.revenue), 0);
  const periodProfit = filteredHistory.reduce((acc, h) => acc + safeNum(h.profit), 0);

  return {
    revenue: periodRevenue,
    profit: periodProfit,
    boxOffice: periodRevenue,
    awards: safeNum(studio.stats?.awardsWon),
    blockbusters: safeNum(studio.stats?.allTimeBlockbusters || studio.stats?.blockbusters),
  };
};

/**
 * Extracts metric value based on metric type and period stats.
 */
export const getMetricValueForStudio = (studio, metric, period, currentWeek) => {
  const pStats = extractPeriodStats(studio, period, currentWeek);

  switch (metric) {
    case RANKING_METRICS.PRESTIGE:
      return safeNum(studio.prestige);
    case RANKING_METRICS.REVENUE:
      return pStats.revenue;
    case RANKING_METRICS.PROFIT:
      return pStats.profit;
    case RANKING_METRICS.BOX_OFFICE:
      return pStats.boxOffice;
    case RANKING_METRICS.FANS:
      return safeNum(studio.fans);
    case RANKING_METRICS.AWARDS:
      return pStats.awards;
    case RANKING_METRICS.BLOCKBUSTERS:
      return pStats.blockbusters;
    case RANKING_METRICS.LEVEL:
      return safeNum(studio.studioLevel, 1);
    default:
      return safeNum(studio.prestige);
  }
};

/**
 * Converts RivalStudio document/object to ranking entry.
 */
export const rivalToRankingEntry = (rival, metric, period, currentWeek) => {
  const totalBoxOffice = (rival.producedMovies || []).reduce((sum, m) => sum + safeNum(m.boxOffice), 0);
  const totalBudget = (rival.producedMovies || []).reduce((sum, m) => sum + safeNum(m.budget), 0);
  const totalProfit = Math.max(0, totalBoxOffice - totalBudget);
  const prestige = safeNum(rival.reputation);
  const fans = Math.round(prestige * 12500 + totalBoxOffice / 2000);
  const level = Math.max(1, Math.min(10, Math.floor(prestige / 10)));
  const blockbusters = (rival.producedMovies || []).filter((m) => safeNum(m.boxOffice) > 100000000).length;
  const awards = Math.floor(prestige / 25);

  let metricValue = prestige;
  if (metric === RANKING_METRICS.REVENUE || metric === RANKING_METRICS.BOX_OFFICE) metricValue = totalBoxOffice;
  else if (metric === RANKING_METRICS.PROFIT) metricValue = totalProfit;
  else if (metric === RANKING_METRICS.FANS) metricValue = fans;
  else if (metric === RANKING_METRICS.LEVEL) metricValue = level;
  else if (metric === RANKING_METRICS.BLOCKBUSTERS) metricValue = blockbusters;
  else if (metric === RANKING_METRICS.AWARDS) metricValue = awards;

  return {
    studioId: String(rival._id || rival.name),
    name: rival.name,
    isRival: true,
    isCurrentUser: false,
    prestige,
    fans,
    studioLevel: level,
    revenue: totalBoxOffice,
    profit: totalProfit,
    boxOffice: totalBoxOffice,
    blockbusters,
    awards,
    moviesReleased: (rival.producedMovies || []).length,
    metricValue,
  };
};

/**
 * Formats a Studio document into ranking entry.
 */
export const studioToRankingEntry = (studio, metric, period, currentWeek, currentUserId = null) => {
  const pStats = extractPeriodStats(studio, period, currentWeek);
  const metricVal = getMetricValueForStudio(studio, metric, period, currentWeek);

  return {
    studioId: String(studio._id),
    name: studio.name,
    isRival: false,
    isCurrentUser: currentUserId ? String(studio.owner) === String(currentUserId) : false,
    prestige: safeNum(studio.prestige),
    fans: safeNum(studio.fans),
    studioLevel: safeNum(studio.studioLevel, 1),
    revenue: pStats.revenue,
    profit: pStats.profit,
    boxOffice: pStats.boxOffice,
    blockbusters: pStats.blockbusters,
    awards: pStats.awards,
    moviesReleased: safeNum(studio.stats?.moviesReleased),
    metricValue: metricVal,
  };
};

/**
 * Retrieves full unified leaderboard with Player and AI studios.
 */
export const getIndustryLeaderboard = async ({
  metric = RANKING_METRICS.PRESTIGE,
  period = TIME_PERIODS.ALL_TIME,
  currentWeek = 52,
  includeAI = true,
  page = 1,
  limit = 20,
  currentUserId = null,
} = {}) => {
  const normMetric = Object.values(RANKING_METRICS).includes(metric) ? metric : RANKING_METRICS.PRESTIGE;
  const normPeriod = Object.values(TIME_PERIODS).includes(period) ? period : TIME_PERIODS.ALL_TIME;

  const studiosPromise = Studio.find().lean();
  const rivalsPromise = includeAI ? RivalStudio.find().lean() : Promise.resolve([]);

  const [studios, rivals] = await Promise.all([studiosPromise, rivalsPromise]);

  const studioEntries = studios.map((s) => studioToRankingEntry(s, normMetric, normPeriod, currentWeek, currentUserId));
  const rivalEntries = rivals.map((r) => rivalToRankingEntry(r, normMetric, normPeriod, currentWeek));

  const allEntries = [...studioEntries, ...rivalEntries];
  allEntries.sort(compareRankings);

  // Assign deterministic rank with ties handled correctly
  let currentRank = 1;
  for (let i = 0; i < allEntries.length; i++) {
    if (i > 0 && compareRankings(allEntries[i - 1], allEntries[i]) === 0) {
      allEntries[i].rank = allEntries[i - 1].rank;
    } else {
      allEntries[i].rank = i + 1;
    }
  }

  const total = allEntries.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (safePage - 1) * limit;
  const pagedLeaderboard = allEntries.slice(startIndex, startIndex + limit);

  let currentUserEntry = null;
  if (currentUserId) {
    currentUserEntry = allEntries.find((e) => e.isCurrentUser) || null;
  }

  return {
    success: true,
    metric: normMetric,
    period: normPeriod,
    currentWeek,
    page: safePage,
    limit,
    total,
    totalPages,
    currentUser: currentUserEntry,
    leaderboard: pagedLeaderboard,
  };
};

/**
 * Updates player & rival rankings in GameState snapshot after weekly tick.
 */
export const updateSimulationRankings = async (gameState, studio) => {
  if (!gameState || !studio) return null;

  const currentWeek = safeNum(gameState.currentWeek, 1);
  const result = await getIndustryLeaderboard({
    metric: RANKING_METRICS.PRESTIGE,
    period: TIME_PERIODS.ALL_TIME,
    currentWeek,
    includeAI: true,
    page: 1,
    limit: 100,
    currentUserId: studio.owner,
  });

  const playerEntry = result.currentUser;
  if (playerEntry) {
    gameState.industryRank = playerEntry.rank;
    gameState.totalCompetitors = result.total;

    // Snapshot into studio seasonStats if year end or initial
    if (currentWeek % 52 === 0 || !studio.seasonStats || studio.seasonStats.length === 0) {
      const year = Math.floor((currentWeek - 1) / 52) + 1;
      studio.seasonStats = studio.seasonStats || [];
      const existingYearIdx = studio.seasonStats.findIndex((s) => s.year === year);
      const snapshot = {
        year,
        week: currentWeek,
        rank: playerEntry.rank,
        prestige: studio.prestige,
        revenue: studio.stats?.totalRevenue || 0,
        profit: studio.stats?.totalProfit || 0,
        fans: studio.fans,
        awards: studio.stats?.awardsWon || 0,
      };

      if (existingYearIdx >= 0) {
        studio.seasonStats[existingYearIdx] = snapshot;
      } else {
        studio.seasonStats.push(snapshot);
        if (studio.seasonStats.length > 20) studio.seasonStats.shift();
      }
    }
  }

  return {
    rank: gameState.industryRank || 1,
    total: result.total,
  };
};
