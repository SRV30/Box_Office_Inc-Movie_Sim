import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateContentValue,
  generateStrategicBids,
  resolveAuctionWinner,
  calculateSubscriberChange,
  processWeeklyStreamingWars,
} from "../src/services/simulation/engines/streamingWarsEngine.js";
import { calculatePlatformBids } from "../src/services/streamingAuctionEngine.js";
import { EXCLUSIVITY_WINDOWS } from "../src/constants/streamingWars.js";

describe("OTT Streaming Wars Engine (issue #546)", () => {
  const sampleMovie = {
    title: "Streaming Blockbuster",
    budget: 80000000,
    worldwideGross: 250000000,
    quality: 85,
    criticScore: 82,
    hype: 75,
  };

  const mockGameState = {
    currentWeek: 10,
    streamingPlatforms: [
      { id: "flixstream", name: "FlixStream", contentBudget: 1000000000, subscribers: 50000000, prestige: 80, exclusiveMovies: [] },
      { id: "netcinema", name: "NetCinema", contentBudget: 1500000000, subscribers: 45000000, prestige: 85, exclusiveMovies: [] },
      { id: "cinemax", name: "CineMax+", contentBudget: 500000000, subscribers: 20000000, prestige: 55, exclusiveMovies: [] },
    ],
  };

  it("evaluates content value using transparent formula", () => {
    const svod = evaluateContentValue(sampleMovie, "POST_THEATRICAL_SVOD");
    const dayDate = evaluateContentValue(sampleMovie, "EXCLUSIVE_DAY_DATE");

    assert.ok(svod > 0);
    assert.ok(dayDate > svod);
    assert.strictEqual(
      dayDate,
      Math.round(svod * EXCLUSIVITY_WINDOWS.EXCLUSIVE_DAY_DATE.valueMultiplier)
    );
  });

  it("generates multiple platform bids sorted by amount", () => {
    const rng = () => 0.9;
    const bids = generateStrategicBids(sampleMovie, "POST_THEATRICAL_SVOD", 500000, mockGameState, rng);

    assert.ok(bids.length >= 3);
    assert.ok(bids[0].amount >= bids[bids.length - 1].amount);
    assert.ok(bids.every((b) => b.amount >= 500000));
  });

  it("resolves winner by highest bid with prestige tie-break", () => {
    const winner = resolveAuctionWinner([
      { platform: "A", amount: 1000000, prestige: 60 },
      { platform: "B", amount: 1000000, prestige: 80 },
      { platform: "C", amount: 900000, prestige: 90 },
    ]);

    assert.strictEqual(winner.platform, "B");
  });

  it("calculatePlatformBids legacy export remains compatible", () => {
    const bids = calculatePlatformBids(sampleMovie, "EXCLUSIVE_DAY_DATE", 500000);
    assert.ok(bids.length >= 3);
    assert.ok(bids[0].amount >= 500000);
  });

  it("calculates subscriber change based on catalog quality", () => {
    const platform = { id: "flixstream", subscribers: 50000000, exclusiveMovies: [1, 2, 3] };
    const highQuality = calculateSubscriberChange(platform, 80);
    const lowQuality = calculateSubscriberChange(platform, 30);

    assert.ok(highQuality.subscriberDelta !== lowQuality.subscriberDelta);
    assert.ok(typeof highQuality.churnRate === "number");
  });

  it("processWeeklyStreamingWars updates platform subscribers", async () => {
    const gameState = JSON.parse(JSON.stringify(mockGameState));
    const studio = { _id: "studio1" };

    const originalFind = (await import("../src/models/StreamingRights.js")).default.find;
    const StreamingRights = (await import("../src/models/StreamingRights.js")).default;
    StreamingRights.find = async () => [];

    try {
      const result = await processWeeklyStreamingWars(gameState, studio);

      assert.ok(Array.isArray(result.subscriberChanges));
      assert.ok(result.subscriberChanges.length > 0);
      assert.ok(gameState.streamingPlatforms[0].contentBudget > mockGameState.streamingPlatforms[0].contentBudget);
    } finally {
      StreamingRights.find = originalFind;
    }
  });
});
