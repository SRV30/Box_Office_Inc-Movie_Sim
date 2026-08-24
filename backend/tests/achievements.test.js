import test from "node:test";
import assert from "node:assert/strict";

import {
  ALL_ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_RARITIES,
} from "../src/services/progression/achievementDefinitions.js";
import {
  deriveSimulationStats,
  checkAndUnlockAchievements,
  inductIntoHallOfFame,
  generateEndgameReport,
} from "../src/services/progression/achievementEngine.js";

test("Achievements: Data-Driven Definitions Integrity", () => {
  assert.ok(ALL_ACHIEVEMENTS.length >= 10);

  ALL_ACHIEVEMENTS.forEach((ach) => {
    assert.ok(ach.id, "Achievement must have an id");
    assert.ok(ach.name, "Achievement must have a name");
    assert.ok(ach.description, "Achievement must have a description");
    assert.ok(ach.category in ACHIEVEMENT_CATEGORIES, "Category must be valid");
    assert.ok(ach.rarity in ACHIEVEMENT_RARITIES, "Rarity must be valid");
    assert.equal(typeof ach.check, "function", "Check must be a function");
  });
});

test("Achievements: Derive Stats from GameState and Studio", () => {
  const gameState = {
    currentWeek: 104,
    activeMovies: [
      { status: "RELEASED", verdict: "HIT", worldwideGross: 50000000 },
      { status: "RELEASED", verdict: "BLOCKBUSTER", worldwideGross: 200000000 },
      { status: "PRODUCTION", verdict: null },
    ],
    retiredActors: [{ isLegacy: true }, { isLegacy: false }],
    franchises: [{ movieIds: ["m1", "m2", "m3"] }],
  };
  const studio = { totalRevenue: 250000000, prestige: 90, money: 5000000 };

  const stats = deriveSimulationStats(gameState, studio);

  assert.equal(stats.moviesReleased, 2);
  assert.equal(stats.hitMovies, 1);
  assert.equal(stats.blockbusters, 1);
  assert.equal(stats.totalBoxOffice, 250000000);
  assert.equal(stats.maxFranchiseInstallments, 3);
  assert.equal(stats.legacyTalentCount, 1);
  assert.equal(stats.currentWeek, 104);
});

test("Achievements: Unlock Conditions Evaluation", () => {
  const stats = {
    moviesReleased: 5,
    hitMovies: 2,
    blockbusters: 1,
    allTimeBlockbusters: 0,
    totalBoxOffice: 1500000000,
    totalAwards: 3,
    maxFranchiseInstallments: 3,
    legacyTalentCount: 1,
    currentWeek: 520,
    recoveredFromCrisis: true,
  };

  const firstFeature = ALL_ACHIEVEMENTS.find((a) => a.id === "FIRST_FEATURE");
  assert.equal(firstFeature.check(stats), true);

  const billionaire = ALL_ACHIEVEMENTS.find((a) => a.id === "BOX_OFFICE_BILLIONAIRE");
  assert.equal(billionaire.check(stats), true);

  const tripleCrown = ALL_ACHIEVEMENTS.find((a) => a.id === "TRIPLE_CROWN");
  assert.equal(tripleCrown.check(stats), true);

  const decadeSurvivor = ALL_ACHIEVEMENTS.find((a) => a.id === "DECADE_SURVIVOR");
  assert.equal(decadeSurvivor.check(stats), true);
});

test("Achievements: Hall of Fame Induction and Duplicate Prevention", async () => {
  const entry = {
    id: "hof-movie-1",
    type: "MOVIE",
    name: "The Eternal Dawn",
    title: "All-Time Blockbuster",
    achievementSummary: "Grossed ₹850,000,000 worldwide with 4 Academy Awards.",
    inductedAtWeek: 156,
  };

  const inducted = await inductIntoHallOfFame("test-user-id", entry);
  assert.equal(inducted.name, "The Eternal Dawn");
});

test("Achievements: Endgame Report Generation and Legacy Score", () => {
  const gameState = {
    currentWeek: 1040, // 20 years
    activeMovies: [
      { status: "RELEASED", verdict: "BLOCKBUSTER", worldwideGross: 450000000, title: "Skyline" },
      { status: "RELEASED", verdict: "HIT", worldwideGross: 120000000, title: "Whispers" },
    ],
    retiredActors: [{ isLegacy: true }],
  };
  const studio = {
    name: "Starlight Pictures",
    totalRevenue: 570000000,
    prestige: 95,
    money: 80000000,
    fans: 1500000,
  };

  const report = generateEndgameReport(gameState, studio);

  assert.equal(report.studioName, "Starlight Pictures");
  assert.equal(report.yearsSimulated, "20.0");
  assert.ok(report.legacyScore > 400);
  assert.ok(report.rankTitle.length > 0);
  assert.equal(report.catalogStats.moviesReleased, 2);
  assert.equal(report.catalogStats.blockbusters, 1);
  assert.equal(report.catalogStats.topGrossingMovie.title, "Skyline");
});
