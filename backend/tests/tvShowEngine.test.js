import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTVShowQuality,
  simulateEpisodeBroadcast,
  evaluateSeasonRenewal,
  checkSyndicationEligibility,
  checkTalentTVConflict,
  processWeeklyTVShows,
} from "../src/services/simulation/engines/tvShowEngine.js";

describe("TV Show, Season, Episode, Ratings & Renewal System Tests", () => {
  it("calculates TV show quality factoring budget, cast size, and key crew", () => {
    const highBudgetShow = {
      budgetPerEpisode: 1000000,
      cast: [{ actorId: "a1" }, { actorId: "a2" }],
      writers: [{ writerId: "w1" }],
      directors: [{ directorId: "d1" }],
    };

    const lowBudgetShow = {
      budgetPerEpisode: 50000,
      cast: [],
      writers: [],
      directors: [],
    };

    const qHigh = calculateTVShowQuality(highBudgetShow);
    const qLow = calculateTVShowQuality(lowBudgetShow);

    assert.ok(qHigh > qLow, "High budget well-staffed show should have superior quality");
    assert.ok(qHigh <= 100);
    assert.ok(qLow >= 25);
  });

  it("simulates episode broadcast ratings, retention curve, and advertising revenue", () => {
    const show = {
      networkOrPlatform: "Broadcast Network",
      quality: 80,
      popularity: 50,
    };
    const season = { episodesCount: 10 };

    const premiere = simulateEpisodeBroadcast(show, season, 1);
    const midSeason = simulateEpisodeBroadcast(show, season, 5);
    const finale = simulateEpisodeBroadcast(show, season, 10);

    assert.strictEqual(premiere.status, "AIRED");
    assert.ok(premiere.viewershipRating > 0);
    assert.ok(premiere.advertisingRevenue > 0);
    assert.ok(finale.viewershipRating >= midSeason.viewershipRating * 0.9, "Finale should feature viewership surge");
    assert.ok(premiere.audienceRetention >= 70);
  });

  it("evaluates season renewal algorithm correctly", () => {
    const show = { totalEpisodesCount: 16 };
    const hitSeason = {
      seasonNumber: 2,
      episodesCount: 8,
      budget: 1600000,
      averageViewership: 6.5,
      criticScore: 85,
      audienceScore: 90,
    };

    const flopSeason = {
      seasonNumber: 1,
      episodesCount: 8,
      budget: 8000000, // Very high cost
      averageViewership: 0.8, // Very low viewership
      criticScore: 30,
      audienceScore: 35,
    };

    const hitResult = evaluateSeasonRenewal(show, hitSeason);
    const flopResult = evaluateSeasonRenewal(show, flopSeason);

    assert.strictEqual(hitResult.renewalVerdict, "RENEWED");
    assert.ok(hitResult.renewalScore >= 55);

    assert.strictEqual(flopResult.renewalVerdict, "CANCELLED");
    assert.ok(flopResult.renewalScore < 55);
  });

  it("determines final season and syndication eligibility when threshold is reached", () => {
    const vetShow = {
      totalEpisodesCount: 96,
    };
    const season6 = {
      seasonNumber: 6,
      episodesCount: 12,
      budget: 2000000,
      averageViewership: 4.0,
      criticScore: 70,
      audienceScore: 75,
    };

    const result = evaluateSeasonRenewal(vetShow, season6);
    assert.strictEqual(result.renewalVerdict, "FINAL_SEASON");

    // Check syndication check
    const syndicationStatus = checkSyndicationEligibility({
      quality: 80,
      seasons: [
        { episodes: Array(20).fill({ status: "AIRED" }) },
        { episodes: Array(20).fill({ status: "AIRED" }) },
        { episodes: Array(20).fill({ status: "AIRED" }) },
        { episodes: Array(20).fill({ status: "AIRED" }) },
        { episodes: Array(20).fill({ status: "AIRED" }) },
      ],
    });

    assert.strictEqual(syndicationStatus.syndicationEligible, true);
    assert.ok(syndicationStatus.weeklySyndicationRoyalty > 0);
  });

  it("detects talent TV scheduling conflicts", () => {
    const activeShows = [
      {
        title: "Empire of Silicon",
        status: "IN_PRODUCTION",
        cast: [{ actorId: "actor_star_1" }],
        directors: [],
      },
    ];

    const conflict = checkTalentTVConflict("actor_star_1", activeShows);
    const noConflict = checkTalentTVConflict("actor_available", activeShows);

    assert.strictEqual(conflict.hasConflict, true);
    assert.strictEqual(conflict.showTitle, "Empire of Silicon");
    assert.strictEqual(noConflict.hasConflict, false);
  });

  it("processes weekly simulation progression and aggregates advertising and syndication payouts", () => {
    const shows = [
      {
        title: "City Lights",
        status: "AIRING",
        networkOrPlatform: "Broadcast Network",
        quality: 75,
        popularity: 40,
        isSyndicated: false,
        seasons: [
          {
            seasonNumber: 1,
            episodesCount: 6,
            currentAiringEpisode: 0,
            status: "AIRING",
            episodes: [],
          },
        ],
      },
      {
        title: "Golden Classics",
        status: "SYNDICATED",
        quality: 80,
        isSyndicated: true,
        seasons: Array(5).fill({
          episodes: Array(16).fill({ status: "AIRED" }),
        }),
      },
    ];

    const tick = processWeeklyTVShows(shows, 1);
    assert.ok(tick.weeklyAdvertisingRevenue > 0, "Airing show should generate weekly ad revenue");
    assert.ok(tick.weeklySyndicationRevenue > 0, "Syndicated show should generate weekly royalty");
    assert.strictEqual(tick.updatedShows[0].seasons[0].currentAiringEpisode, 1);
  });
});
