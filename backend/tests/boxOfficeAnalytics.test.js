import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateRegionalBreakdown,
  computeScreenDecay,
  computeClashImpactSummary,
  generateBoxOfficeTelemetry,
} from "../src/utils/boxOfficeAnalytics.js";
import { generateBoxOffice } from "../src/services/simulation/engines/boxOfficeEngine.js";
import { validateBoxOfficeAnalyticsSchema } from "../src/validators/boxOfficeValidator.js";

describe("Box Office Analytics Unit Tests", () => {
  test("calculateRegionalBreakdown generates non-negative regional shares", () => {
    const split = calculateRegionalBreakdown(1000000);
    assert.equal(split.totalWorldwide, 1000000);
    assert.ok(split.northAmerica > 0);
    assert.ok(split.europe > 0);
    assert.ok(split.asiaPacific > 0);
    assert.ok(split.latinAmerica > 0);
  });

  test("computeScreenDecay reduces screens over time", () => {
    const week1 = computeScreenDecay(1, 2000, 80);
    const week3 = computeScreenDecay(3, 2000, 80);
    assert.equal(week1, 2000);
    assert.ok(week3 < week1);
  });

  test("computeClashImpactSummary calculates projected revenue loss", () => {
    const summary = computeClashImpactSummary(10000000, 2);
    assert.equal(summary.originalProjection, 10000000);
    assert.ok(summary.adjustedProjection < 10000000);
  });

  test("generateBoxOfficeTelemetry builds comprehensive report", () => {
    const movie = {
      _id: "6a8086418bbe0b12d429564d",
      title: "Interstellar Horizon",
      worldwideGross: 500000000,
      budget: 150000000,
      marketingBudget: 50000000,
      audienceScore: 88,
    };
    const telemetry = generateBoxOfficeTelemetry(movie);
    assert.equal(telemetry.title, "Interstellar Horizon");
    assert.equal(telemetry.worldwideGross, 500000000);
    assert.equal(telemetry.totalBudget, 200000000);
    assert.ok(telemetry.profitMargin > 0);
    assert.ok(telemetry.regionalBreakdown.northAmerica > 0);
  });

  test("validateBoxOfficeAnalyticsSchema parses valid movieId params", () => {
    const parsed = validateBoxOfficeAnalyticsSchema.params.parse({ movieId: "valid_id_123" });
    assert.equal(parsed.movieId, "valid_id_123");
  });

  test("generateBoxOffice returns regionalSplit in calculation output", () => {
    const movie = { quality: 80, criticScore: 75, audienceScore: 85, hype: 80, budget: 10000000, marketingBudget: 5000000 };
    const leadActor = { popularity: 90 };
    const result = generateBoxOffice(movie, leadActor, null, 1);

    assert.ok(result.regionalSplit);
    assert.ok(result.regionalSplit.northAmerica > 0);
    assert.ok(result.regionalSplit.europe > 0);
  });
});
