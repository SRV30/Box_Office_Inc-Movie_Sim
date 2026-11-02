import { test, describe, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { generateBoxOffice, MAX_GROSS } from "../src/services/simulation/engines/boxOfficeEngine.js";
import { generateReviews } from "../src/services/simulation/engines/reviewEngine.js";
import { processWriterPayroll } from "../src/services/simulation/engines/payrollEngine.js";
import { VERDICTS } from "../src/constants/verdicts.js";

// ============================================================================
// 1. Box Office Revenue Calculation (boxOfficeEngine)
// ============================================================================
describe("Core Calculation: Box Office Revenue Engine", () => {
  beforeEach(() => {
    // Deterministic random mock: 0.5 produces neutral scale factors (1.0x)
    mock.method(Math, "random", () => 0.5);
  });

  afterEach(() => {
    mock.reset();
  });

  test("Normal operation: calculates expected revenue, splits, ROI, and verdict deterministically", () => {
    const movie = {
      budget: 10_000_000,
      marketingBudget: 5_000_000,
      quality: 70,
      criticScore: 80,
      audienceScore: 80,
      hype: 60,
      sequelNumber: 1,
    };
    const leadActor = { popularity: 80 };
    const director = {};
    const franchise = { popularity: 50, movieCount: 0 };

    const result = generateBoxOffice(movie, leadActor, director, 1, 1, franchise);

    // Exact deterministic arithmetic validation
    assert.strictEqual(result.openingWeekend, 5_397_000);
    assert.strictEqual(result.worldwideGross, 43_985_550);
    assert.strictEqual(result.boxOffice, 43_985_550);
    assert.strictEqual(result.domesticGross, 19_793_498);
    assert.strictEqual(result.internationalGross, 24_192_052);
    assert.strictEqual(result.domesticGross + result.internationalGross, result.worldwideGross);

    // Financial bottom-line validation
    const totalBudget = movie.budget + movie.marketingBudget;
    assert.strictEqual(result.profit, result.worldwideGross - totalBudget);
    assert.strictEqual(result.profit, 28_985_550);
    assert.strictEqual(result.roi, 28_985_550 / 15_000_000);
    assert.strictEqual(result.verdict, VERDICTS.BLOCKBUSTER);

    // Regional split distribution validation
    assert.strictEqual(result.regionalSplit.northAmerica, result.domesticGross);
    assert.strictEqual(result.regionalSplit.europe, Math.round(result.internationalGross * 0.45));
    assert.strictEqual(result.regionalSplit.asiaPacific, Math.round(result.internationalGross * 0.40));
    assert.strictEqual(result.regionalSplit.latinAmerica, Math.round(result.internationalGross * 0.15));
  });

  test("Edge case: zero production budget and zero marketing budget", () => {
    const movie = {
      budget: 0,
      marketingBudget: 0,
      quality: 50,
      criticScore: 50,
      audienceScore: 50,
      hype: 50,
    };
    const leadActor = { popularity: 50 };
    const director = {};

    const result = generateBoxOffice(movie, leadActor, director);

    // Should utilize 1,000,000 baseline scale budget without dividing by zero
    assert.ok(result.openingWeekend > 0);
    assert.ok(result.worldwideGross > 0);
    assert.strictEqual(result.profit, result.worldwideGross);
    // When totalBudget is 0, roi is defined as worldwideGross / 1_000_000
    assert.strictEqual(result.roi, result.worldwideGross / 1_000_000);
    assert.strictEqual(result.domesticGross + result.internationalGross, result.worldwideGross);
  });

  test("Edge case: empty cast (zero popularity lead actor) and zero director impact", () => {
    const movie = {
      budget: 5_000_000,
      marketingBudget: 0,
      quality: 40,
      criticScore: 30,
      audienceScore: 30,
      hype: 10,
    };
    const leadActor = { popularity: 0 };
    const director = {};

    const result = generateBoxOffice(movie, leadActor, director);

    // Star power should contribute 0, calculation remains non-negative and valid
    assert.ok(result.openingWeekend > 0);
    assert.ok(result.worldwideGross > 0);
    assert.strictEqual(result.domesticGross + result.internationalGross, result.worldwideGross);
    assert.ok(typeof result.verdict === "string");
  });

  test("Maximum values: caps worldwideGross and openingWeekend at MAX_GROSS", () => {
    const megaMovie = {
      budget: 50_000_000_000, // 50 Billion
      marketingBudget: 10_000_000_000,
      quality: 100,
      criticScore: 100,
      audienceScore: 100,
      hype: 100,
    };
    const superstarActor = { popularity: 100 };
    const director = {};

    const result = generateBoxOffice(megaMovie, superstarActor, director, 2.0, 2.0);

    assert.strictEqual(result.openingWeekend, MAX_GROSS);
    assert.strictEqual(result.worldwideGross, MAX_GROSS);
    assert.strictEqual(result.boxOffice, MAX_GROSS);
    assert.ok(result.domesticGross <= MAX_GROSS);
    assert.ok(result.internationalGross <= MAX_GROSS);
    assert.strictEqual(result.domesticGross + result.internationalGross, MAX_GROSS);
  });

  test("Boundary conditions: franchise sequel multipliers and fatigue penalties", () => {
    const baseMovie = {
      budget: 10_000_000,
      marketingBudget: 0,
      quality: 60,
      criticScore: 60,
      audienceScore: 60,
      hype: 50,
    };
    const leadActor = { popularity: 50 };

    // Sequel 1 (no bonus)
    const seq1 = generateBoxOffice({ ...baseMovie, sequelNumber: 1 }, leadActor, {});
    // Sequel 2 (10% bonus)
    const seq2 = generateBoxOffice({ ...baseMovie, sequelNumber: 2 }, leadActor, {});
    // Sequel 6 (max 50% bonus)
    const seq6 = generateBoxOffice({ ...baseMovie, sequelNumber: 6 }, leadActor, {});
    // Sequel 10 (capped at 50% bonus)
    const seq10 = generateBoxOffice({ ...baseMovie, sequelNumber: 10 }, leadActor, {});

    assert.ok(seq2.openingWeekend > seq1.openingWeekend);
    assert.ok(seq6.openingWeekend > seq2.openingWeekend);
    assert.strictEqual(seq10.openingWeekend, seq6.openingWeekend);

    // Fatigue penalty: franchise movie count > 6 applies fatigue, floored at 0.75
    const normalFranchise = generateBoxOffice(baseMovie, leadActor, {}, 1, 1, { movieCount: 6 });
    const tiredFranchise = generateBoxOffice(baseMovie, leadActor, {}, 1, 1, { movieCount: 10 });
    const exhaustedFranchise = generateBoxOffice(baseMovie, leadActor, {}, 1, 1, { movieCount: 50 });

    assert.ok(tiredFranchise.openingWeekend < normalFranchise.openingWeekend);
    assert.ok(exhaustedFranchise.openingWeekend <= tiredFranchise.openingWeekend);
  });

  test("Boundary conditions: random variance boundaries (random = 0 and random = 1)", () => {
    const movie = {
      budget: 10_000_000,
      marketingBudget: 2_000_000,
      quality: 60,
      criticScore: 60,
      audienceScore: 60,
      hype: 50,
    };
    const leadActor = { popularity: 50 };

    // Minimum random variance
    mock.method(Math, "random", () => 0.0);
    const minResult = generateBoxOffice(movie, leadActor, {});

    // Maximum random variance
    mock.method(Math, "random", () => 1.0);
    const maxResult = generateBoxOffice(movie, leadActor, {});

    assert.ok(minResult.openingWeekend < maxResult.openingWeekend);
    assert.ok(minResult.worldwideGross < maxResult.worldwideGross);
    assert.ok(minResult.openingWeekend > 0);
  });
});

// ============================================================================
// 2. Audience and Critic Rating Calculation (reviewEngine)
// ============================================================================
describe("Core Calculation: Audience and Critic Review Ratings Engine", () => {
  test("Normal operation: computes exact weighted critic and audience scores and labels", () => {
    const movie = { quality: 70 };
    const script = { quality: 80, audienceAppeal: 60 };
    const director = { creativity: 70, reputation: 65 };
    const leadActor = { actingSkill: 90, popularity: 85 };
    const crewTeam = { technicalQuality: 75 };

    const reviews = generateReviews(movie, script, director, leadActor, crewTeam);

    // Critic: round(80*0.4 + 70*0.3 + 75*0.2 + 90*0.1) = round(32 + 21 + 15 + 9) = 77
    assert.strictEqual(reviews.criticScore, 77);
    assert.strictEqual(reviews.criticLabel, "Good");

    // Audience: round(85*0.35 + 60*0.25 + 65*0.2 + 70*0.2) = round(29.75 + 15 + 13 + 14) = round(71.75) = 72
    assert.strictEqual(reviews.audienceScore, 72);
    assert.strictEqual(reviews.audienceLabel, "Good");
  });

  test("Edge case: zero stats produce minimum 0 score and 'Terrible' label", () => {
    const zeroMovie = { quality: 0 };
    const zeroScript = { quality: 0, audienceAppeal: 0 };
    const zeroDirector = { creativity: 0, reputation: 0 };
    const zeroActor = { actingSkill: 0, popularity: 0 };
    const zeroCrew = { technicalQuality: 0 };

    const reviews = generateReviews(zeroMovie, zeroScript, zeroDirector, zeroActor, zeroCrew);

    assert.strictEqual(reviews.criticScore, 0);
    assert.strictEqual(reviews.criticLabel, "Terrible");
    assert.strictEqual(reviews.audienceScore, 0);
    assert.strictEqual(reviews.audienceLabel, "Terrible");
  });

  test("Edge case: completely empty cast, crew, and talent default safely to 50 / 'Average'", () => {
    const reviews = generateReviews(null, null, null, null, null);

    assert.strictEqual(reviews.criticScore, 50);
    assert.strictEqual(reviews.criticLabel, "Average");
    assert.strictEqual(reviews.audienceScore, 50);
    assert.strictEqual(reviews.audienceLabel, "Average");

    // Also with empty objects
    const emptyObjReviews = generateReviews({}, {}, {}, {}, {});
    assert.strictEqual(emptyObjReviews.criticScore, 50);
    assert.strictEqual(emptyObjReviews.criticLabel, "Average");
    assert.strictEqual(emptyObjReviews.audienceScore, 50);
    assert.strictEqual(emptyObjReviews.audienceLabel, "Average");
  });

  test("Maximum values: maximum stats cap at 100 with 'Excellent' label", () => {
    const perfectMovie = { quality: 100 };
    const perfectScript = { quality: 100, audienceAppeal: 100 };
    const perfectDirector = { creativity: 100, reputation: 100 };
    const perfectActor = { actingSkill: 100, popularity: 100 };
    const perfectCrew = { technicalQuality: 100 };

    const reviews = generateReviews(perfectMovie, perfectScript, perfectDirector, perfectActor, perfectCrew);

    assert.strictEqual(reviews.criticScore, 100);
    assert.strictEqual(reviews.criticLabel, "Excellent");
    assert.strictEqual(reviews.audienceScore, 100);
    assert.strictEqual(reviews.audienceLabel, "Excellent");

    // Overflow values (>100) are clamped to 100
    const overflowReviews = generateReviews(
      { quality: 200 },
      { quality: 200, audienceAppeal: 200 },
      { creativity: 200, reputation: 200 },
      { actingSkill: 200, popularity: 200 },
      { technicalQuality: 200 }
    );
    assert.strictEqual(overflowReviews.criticScore, 100);
    assert.strictEqual(overflowReviews.audienceScore, 100);
  });

  test("Boundary conditions: qualitative review score thresholds", () => {
    // Score <= 20 -> Terrible
    // 50 * 0.4 = 20
    const s20 = generateReviews(
      { quality: 0 },
      { quality: 50, audienceAppeal: 0 },
      { creativity: 0, reputation: 0 },
      { actingSkill: 0, popularity: 0 },
      { technicalQuality: 0 }
    );
    assert.strictEqual(s20.criticScore, 20);
    assert.strictEqual(s20.criticLabel, "Terrible");

    // Score 21 -> Poor
    // 52.5 * 0.4 = 21
    const s21 = generateReviews(
      { quality: 0 },
      { quality: 53, audienceAppeal: 0 },
      { creativity: 0, reputation: 0 },
      { actingSkill: 0, popularity: 0 },
      { technicalQuality: 0 }
    );
    assert.strictEqual(s21.criticScore, 21);
    assert.strictEqual(s21.criticLabel, "Poor");

    // Score 40 -> Poor
    // 100 * 0.4 = 40
    const s40 = generateReviews(
      { quality: 0 },
      { quality: 100, audienceAppeal: 0 },
      { creativity: 0, reputation: 0 },
      { actingSkill: 0, popularity: 0 },
      { technicalQuality: 0 }
    );
    assert.strictEqual(s40.criticScore, 40);
    assert.strictEqual(s40.criticLabel, "Poor");

    // Score 41 -> Average (40 + 1)
    const s41 = generateReviews(
      { quality: 0 },
      { quality: 100, audienceAppeal: 0 },
      { creativity: 0, reputation: 0 },
      { actingSkill: 10, popularity: 0 },
      { technicalQuality: 0 }
    );
    assert.strictEqual(s41.criticScore, 41);
    assert.strictEqual(s41.criticLabel, "Average");

    // Score 60 -> Average
    // 100 * 0.4 + 100 * 0.2 = 60
    const s60 = generateReviews(
      { quality: 0 },
      { quality: 100, audienceAppeal: 0 },
      { creativity: 0, reputation: 0 },
      { actingSkill: 0, popularity: 0 },
      { technicalQuality: 100 }
    );
    assert.strictEqual(s60.criticScore, 60);
    assert.strictEqual(s60.criticLabel, "Average");

    // Score 61 -> Good
    const s61 = generateReviews(
      { quality: 0 },
      { quality: 100, audienceAppeal: 0 },
      { creativity: 0, reputation: 0 },
      { actingSkill: 10, popularity: 0 },
      { technicalQuality: 100 }
    );
    assert.strictEqual(s61.criticScore, 61);
    assert.strictEqual(s61.criticLabel, "Good");

    // Score 80 -> Good
    // 100 * 0.4 + 100 * 0.3 + 100 * 0.1 = 80
    const s80 = generateReviews(
      { quality: 0 },
      { quality: 100, audienceAppeal: 0 },
      { creativity: 100, reputation: 0 },
      { actingSkill: 100, popularity: 0 },
      { technicalQuality: 0 }
    );
    assert.strictEqual(s80.criticScore, 80);
    assert.strictEqual(s80.criticLabel, "Good");

    // Score 81 -> Excellent
    // 100 * 0.4 + 100 * 0.3 + 100 * 0.1 + 5 * 0.2 = 81
    const s81 = generateReviews(
      { quality: 0 },
      { quality: 100, audienceAppeal: 0 },
      { creativity: 100, reputation: 0 },
      { actingSkill: 100, popularity: 0 },
      { technicalQuality: 5 }
    );
    assert.strictEqual(s81.criticScore, 81);
    assert.strictEqual(s81.criticLabel, "Excellent");
  });

  test("Boundary conditions: stat parsing handles stringified and malformed numbers", () => {
    const reviews = generateReviews(
      { quality: "70" },
      { quality: "80", audienceAppeal: "" },
      { creativity: null, reputation: undefined },
      { actingSkill: "invalid", popularity: "90" },
      { technicalQuality: 60 }
    );

    assert.ok(!Number.isNaN(reviews.criticScore));
    assert.ok(!Number.isNaN(reviews.audienceScore));
    assert.strictEqual(typeof reviews.criticLabel, "string");
    assert.strictEqual(typeof reviews.audienceLabel, "string");
  });
});

// ============================================================================
// 3. Weekly Payroll Calculation (payrollEngine)
// ============================================================================
describe("Core Calculation: Weekly Payroll Engine", () => {
  test("Normal operation: fully covers payroll across writers, directors, actors, and crew", () => {
    const gameState = {
      ownedWriters: [{ id: "w1", salary: 5_000, totalEarnings: 10_000 }],
      ownedDirectors: [{ id: "d1", salary: 15_000, totalEarnings: 30_000 }],
      ownedActors: [
        { id: "a1", salary: 25_000, totalEarnings: 50_000 },
        { id: "a2", salary: 10_000, totalEarnings: 20_000 },
      ],
      ownedCrewTeams: [{ id: "c1", salary: 8_000, totalEarnings: 16_000 }],
    };
    const studio = { money: 500_000 };

    const paid = processWriterPayroll(gameState, studio);

    // Total weekly payroll = 5000 + 15000 + 25000 + 10000 + 8000 = 63,000
    assert.strictEqual(paid, 63_000);
    assert.strictEqual(studio.money, 437_000);
    assert.strictEqual(gameState.ownedWriters[0].totalEarnings, 15_000);
    assert.strictEqual(gameState.ownedDirectors[0].totalEarnings, 45_000);
    assert.strictEqual(gameState.ownedActors[0].totalEarnings, 75_000);
    assert.strictEqual(gameState.ownedActors[1].totalEarnings, 30_000);
    assert.strictEqual(gameState.ownedCrewTeams[0].totalEarnings, 24_000);
    assert.strictEqual(studio.bankruptcyWarning, undefined);
  });

  test("Edge case: empty cast, crew, and talent rosters is a safe no-op", () => {
    const gameState = {
      ownedWriters: [],
      ownedDirectors: [],
      ownedActors: [],
      ownedCrewTeams: [],
    };
    const studio = { money: 100_000 };

    const result = processWriterPayroll(gameState, studio);

    assert.strictEqual(result, undefined);
    assert.strictEqual(studio.money, 100_000);
  });

  test("Edge case: missing talent rosters on gameState object is a safe no-op", () => {
    const gameState = {};
    const studio = { money: 50_000 };

    const result = processWriterPayroll(gameState, studio);

    assert.strictEqual(result, undefined);
    assert.strictEqual(studio.money, 50_000);
  });

  test("Edge case: talent with zero salaries is a safe no-op", () => {
    const gameState = {
      ownedActors: [{ salary: 0, totalEarnings: 0 }],
      ownedWriters: [{ salary: 0 }],
    };
    const studio = { money: 20_000 };

    const result = processWriterPayroll(gameState, studio);

    assert.strictEqual(result, undefined);
    assert.strictEqual(studio.money, 20_000);
  });

  test("Edge case: zero budget studio (balance ₹0) skips payroll and marks bankruptcy warning", () => {
    const gameState = {
      _pendingNotifications: [],
      ownedActors: [{ salary: 50_000, totalEarnings: 100_000 }],
    };
    const studio = { money: 0 };

    const result = processWriterPayroll(gameState, studio);

    assert.strictEqual(result, undefined);
    assert.strictEqual(studio.money, 0);
    assert.strictEqual(studio.bankruptcyWarning, true);
    assert.strictEqual(gameState.ownedActors[0].totalEarnings, 100_000); // Unchanged
    assert.strictEqual(gameState._pendingNotifications.length, 1);
    assert.match(gameState._pendingNotifications[0].message, /insolvent/i);
  });

  test("Edge case: negative studio balance skips payroll without further deductions", () => {
    const gameState = {
      _pendingNotifications: [],
      ownedActors: [{ salary: 10_000, totalEarnings: 0 }],
    };
    const studio = { money: -5_000 };

    const result = processWriterPayroll(gameState, studio);

    assert.strictEqual(result, undefined);
    assert.strictEqual(studio.money, -5_000);
    assert.strictEqual(studio.bankruptcyWarning, true);
  });

  test("Boundary conditions: partial payroll payment when studio is underfunded", () => {
    const gameState = {
      _pendingNotifications: [],
      ownedActors: [
        { salary: 6_000, totalEarnings: 0 },
        { salary: 4_000, totalEarnings: 0 },
      ],
    };
    const studio = { money: 5_000 }; // 50% coverage of 10,000 total

    const paid = processWriterPayroll(gameState, studio);

    assert.strictEqual(paid, 5_000);
    assert.strictEqual(studio.money, 0);
    assert.strictEqual(gameState.ownedActors[0].totalEarnings, 3_000);
    assert.strictEqual(gameState.ownedActors[1].totalEarnings, 2_000);
    assert.strictEqual(gameState._pendingNotifications.length, 1);
    assert.match(gameState._pendingNotifications[0].message, /cannot afford/i);
  });

  test("Boundary conditions: partial payment floor remainder stays in studio balance", () => {
    const gameState = {
      _pendingNotifications: [],
      ownedActors: [
        { salary: 50, totalEarnings: 0 },
        { salary: 50, totalEarnings: 0 },
        { salary: 50, totalEarnings: 0 },
      ],
    };
    // Total payroll = 150. Studio has 100. Coverage = 100 / 150 = 2/3.
    // Each talent receives floor(50 * 2/3) = 33.
    // Total actually paid = 99. Remainder of 1 should remain in studio money.
    const studio = { money: 100 };

    const paid = processWriterPayroll(gameState, studio);

    assert.strictEqual(paid, 99);
    assert.strictEqual(gameState.ownedActors[0].totalEarnings, 33);
    assert.strictEqual(gameState.ownedActors[1].totalEarnings, 33);
    assert.strictEqual(gameState.ownedActors[2].totalEarnings, 33);
    assert.strictEqual(studio.money, 1);
  });

  test("Boundary conditions: exact availableMoney equals totalPayroll (100% boundary)", () => {
    const gameState = {
      _pendingNotifications: [],
      ownedActors: [{ salary: 10_000, totalEarnings: 5_000 }],
    };
    const studio = { money: 10_000 };

    const paid = processWriterPayroll(gameState, studio);

    assert.strictEqual(paid, 10_000);
    assert.strictEqual(studio.money, 0);
    assert.strictEqual(gameState.ownedActors[0].totalEarnings, 15_000);
    // When money == totalPayroll, no "cannot afford" warning should be triggered
    assert.strictEqual(gameState._pendingNotifications.length, 0);
  });

  test("Maximum values: handles large salary and cash numbers cleanly", () => {
    const gameState = {
      ownedWriters: [{ salary: 100_000_000, totalEarnings: 0 }],
      ownedDirectors: [{ salary: 250_000_000, totalEarnings: 0 }],
      ownedActors: [{ salary: 500_000_000, totalEarnings: 0 }],
      ownedCrewTeams: [{ salary: 150_000_000, totalEarnings: 0 }],
    };
    // Total payroll = 1,000,000,000 (1 Billion)
    const studio = { money: 5_000_000_000 }; // 5 Billion

    const paid = processWriterPayroll(gameState, studio);

    assert.strictEqual(paid, 1_000_000_000);
    assert.strictEqual(studio.money, 4_000_000_000);
    assert.strictEqual(gameState.ownedActors[0].totalEarnings, 500_000_000);
  });

  test("Defensive: handles talent object without totalEarnings property gracefully", () => {
    const gameState = {
      ownedActors: [{ salary: 5_000 }], // No totalEarnings property
    };
    const studio = { money: 20_000 };

    const paid = processWriterPayroll(gameState, studio);

    assert.strictEqual(paid, 5_000);
    assert.strictEqual(studio.money, 15_000);
    assert.strictEqual(gameState.ownedActors[0].totalEarnings, undefined);
  });
});
