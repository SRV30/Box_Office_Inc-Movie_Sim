import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateStreamingRevenuePotential,
  computeHybridReleaseStrategy,
} from "../src/services/simulation/engines/streamingEngine.js";
import { streamingCatalogQuerySchema } from "../src/validators/streamingValidators.js";

describe("Streaming Release Strategy Engine", () => {
  test("calculateStreamingRevenuePotential returns positive potential and conversion rate", () => {
    const result = calculateStreamingRevenuePotential({ quality: 80, hype: 70, budget: 50_000_000 }, 50_000_000);
    assert.ok(result.streamingPotential > 0, "streaming potential should be > 0");
    assert.ok(result.conversionRate > 0 && result.conversionRate <= 0.15, "conversion rate should be within [0, 0.15]");
  });

  test("calculateStreamingRevenuePotential caps conversion rate at 15%", () => {
    const result = calculateStreamingRevenuePotential({ quality: 100, hype: 100 }, 100_000_000);
    assert.ok(result.conversionRate <= 0.15);
  });

  test("calculateStreamingRevenuePotential handles zero quality gracefully", () => {
    const result = calculateStreamingRevenuePotential({ quality: 0, hype: 0, budget: 10_000_000 }, 10_000_000);
    assert.ok(result.streamingPotential >= 0);
  });

  test("computeHybridReleaseStrategy recommends THEATRICAL_EXTENDED for high ROI films", () => {
    const result = computeHybridReleaseStrategy(300_000_000, 100_000_000, 5);
    assert.equal(result.recommendation, "THEATRICAL_EXTENDED");
    assert.ok(result.streamingWindowWeek > 5);
  });

  test("computeHybridReleaseStrategy recommends HYBRID_DAY_DATE for moderate ROI", () => {
    const result = computeHybridReleaseStrategy(100_000_000, 100_000_000, 3);
    assert.equal(result.recommendation, "HYBRID_DAY_DATE");
  });

  test("computeHybridReleaseStrategy recommends EARLY_STREAMING_PIVOT for underperformers", () => {
    const result = computeHybridReleaseStrategy(10_000_000, 100_000_000, 1);
    assert.equal(result.recommendation, "EARLY_STREAMING_PIVOT");
  });

  test("streamingCatalogQuerySchema validates query parameters accurately", () => {
    const parsed = streamingCatalogQuerySchema.query.parse({
      platformId: "netflix_id",
      search: "Inception",
    });
    assert.equal(parsed.platformId, "netflix_id");
    assert.equal(parsed.search, "Inception");
  });
});
