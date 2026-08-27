import { describe, it } from "node:test";
import assert from "node:assert";
import {
  compareRankings,
  extractPeriodStats,
  getMetricValueForStudio,
  studioToRankingEntry,
  rivalToRankingEntry,
  RANKING_METRICS,
  TIME_PERIODS,
} from "../src/services/simulation/industryLeaderboardEngine.js";

describe("Industry Leaderboard & Ranking System Engine Tests", () => {
  it("deterministic tie breakers: orders by metric value descending", () => {
    const a = { name: "Studio A", metricValue: 500, prestige: 80, fans: 10000 };
    const b = { name: "Studio B", metricValue: 400, prestige: 90, fans: 20000 };
    assert.ok(compareRankings(a, b) < 0);
    assert.ok(compareRankings(b, a) > 0);
  });

  it("deterministic tie breakers: ties broken by prestige descending", () => {
    const a = { name: "Studio A", metricValue: 500, prestige: 95, fans: 10000 };
    const b = { name: "Studio B", metricValue: 500, prestige: 85, fans: 50000 };
    assert.ok(compareRankings(a, b) < 0);
    assert.ok(compareRankings(b, a) > 0);
  });

  it("deterministic tie breakers: secondary tie broken by fans descending", () => {
    const a = { name: "Studio A", metricValue: 500, prestige: 85, fans: 75000 };
    const b = { name: "Studio B", metricValue: 500, prestige: 85, fans: 25000 };
    assert.ok(compareRankings(a, b) < 0);
    assert.ok(compareRankings(b, a) > 0);
  });

  it("deterministic tie breakers: final tie broken by name alphabetical ascending", () => {
    const a = { name: "Alpha Pictures", metricValue: 500, prestige: 85, fans: 25000 };
    const b = { name: "Zeta Films", metricValue: 500, prestige: 85, fans: 25000 };
    assert.ok(compareRankings(a, b) < 0);
    assert.ok(compareRankings(b, a) > 0);
  });

  it("extracts period stats correctly for weekly, monthly, yearly, and all_time", () => {
    const mockStudio = {
      prestige: 75,
      fans: 120000,
      stats: {
        totalRevenue: 50000000,
        totalProfit: 20000000,
        awardsWon: 5,
        allTimeBlockbusters: 2,
      },
      financialHistory: [
        { week: 10, revenue: 1000000, profit: 400000 },
        { week: 49, revenue: 2000000, profit: 800000 },
        { week: 51, revenue: 3000000, profit: 1200000 },
        { week: 52, revenue: 4000000, profit: 1600000 },
      ],
    };

    // All time
    const allTimeStats = extractPeriodStats(mockStudio, TIME_PERIODS.ALL_TIME, 52);
    assert.strictEqual(allTimeStats.revenue, 50000000);
    assert.strictEqual(allTimeStats.profit, 20000000);

    // Weekly (week 52 only)
    const weeklyStats = extractPeriodStats(mockStudio, TIME_PERIODS.WEEKLY, 52);
    assert.strictEqual(weeklyStats.revenue, 4000000);
    assert.strictEqual(weeklyStats.profit, 1600000);

    // Monthly (weeks 48 to 52)
    const monthlyStats = extractPeriodStats(mockStudio, TIME_PERIODS.MONTHLY, 52);
    assert.strictEqual(monthlyStats.revenue, 9000000); // 2M + 3M + 4M
    assert.strictEqual(monthlyStats.profit, 3600000); // 800k + 1.2M + 1.6M
  });

  it("handles empty financial history gracefully", () => {
    const emptyStudio = {
      prestige: 10,
      fans: 500,
      stats: {},
      financialHistory: [],
    };
    const stats = extractPeriodStats(emptyStudio, TIME_PERIODS.MONTHLY, 10);
    assert.strictEqual(stats.revenue, 0);
    assert.strictEqual(stats.profit, 0);
  });

  it("formats studio ranking entry and respects currentUserId", () => {
    const studio = {
      _id: "60d5ec49f1b2c8b1f8c8e111",
      owner: "60d5ec49f1b2c8b1f8c8e999",
      name: "Solaris Studios",
      prestige: 88,
      fans: 450000,
      studioLevel: 4,
      stats: { totalRevenue: 15000000, moviesReleased: 3, awardsWon: 2 },
    };

    const entrySelf = studioToRankingEntry(
      studio,
      RANKING_METRICS.PRESTIGE,
      TIME_PERIODS.ALL_TIME,
      52,
      "60d5ec49f1b2c8b1f8c8e999"
    );
    assert.strictEqual(entrySelf.isCurrentUser, true);
    assert.strictEqual(entrySelf.isRival, false);
    assert.strictEqual(entrySelf.prestige, 88);

    const entryOther = studioToRankingEntry(
      studio,
      RANKING_METRICS.PRESTIGE,
      TIME_PERIODS.ALL_TIME,
      52,
      "60d5ec49f1b2c8b1f8c8e000"
    );
    assert.strictEqual(entryOther.isCurrentUser, false);
  });

  it("formats AI RivalStudio into valid ranking entry", () => {
    const rival = {
      _id: "rival_123",
      name: "Apex Global Pictures",
      reputation: 95,
      producedMovies: [
        { title: "Epic 1", budget: 50000000, boxOffice: 150000000 },
        { title: "Epic 2", budget: 80000000, boxOffice: 220000000 },
      ],
    };

    const rivalEntry = rivalToRankingEntry(
      rival,
      RANKING_METRICS.BOX_OFFICE,
      TIME_PERIODS.ALL_TIME,
      52
    );
    assert.strictEqual(rivalEntry.isRival, true);
    assert.strictEqual(rivalEntry.isCurrentUser, false);
    assert.strictEqual(rivalEntry.boxOffice, 370000000);
    assert.strictEqual(rivalEntry.moviesReleased, 2);
    assert.strictEqual(rivalEntry.blockbusters, 2);
  });
});
