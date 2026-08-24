import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_STRATEGIES,
  AI_STRATEGY_PROFILES,
  selectOptimalGenre,
  generateMovieConcept,
  scoutTalentPackage,
  scheduleOptimalRelease,
  decideAndGreenlightMovie,
  processRivalFinancials,
} from "../src/services/simulation/engines/aiEngine.js";
import {
  generateRivalStudios,
  processRivalStudios,
} from "../src/services/simulation/engines/rivalStudioEngine.js";

test("AI Engine: Strategy Profiles Initialization", () => {
  assert.ok(AI_STRATEGY_PROFILES[AI_STRATEGIES.BLOCKBUSTER]);
  assert.ok(AI_STRATEGY_PROFILES[AI_STRATEGIES.PRESTIGE]);
  assert.ok(AI_STRATEGY_PROFILES[AI_STRATEGIES.INDIE]);
  assert.ok(AI_STRATEGY_PROFILES[AI_STRATEGIES.COMMERCIAL]);
  assert.ok(AI_STRATEGY_PROFILES[AI_STRATEGIES.FRANCHISE_FOCUSED]);
  assert.ok(AI_STRATEGY_PROFILES[AI_STRATEGIES.CHAOTIC]);
});

test("AI Engine: Genre Selection with Trend Awareness", () => {
  const blockbusterRival = { personality: AI_STRATEGIES.BLOCKBUSTER };

  // 1. With Sci-Fi Booming trend
  const gameStateWithBoom = {
    marketTrends: {
      activeTrends: [{ genre: "Sci-Fi", type: "BOOM" }],
    },
  };
  const chosenGenre = selectOptimalGenre(blockbusterRival, gameStateWithBoom);
  assert.ok(["Action", "Sci-Fi", "Adventure", "Thriller"].includes(chosenGenre));

  // 2. With Action Fatigued trend
  const gameStateWithFatigue = {
    marketTrends: {
      activeTrends: [{ genre: "Action", type: "FATIGUE" }],
    },
  };
  const genreNonFatigued = selectOptimalGenre(blockbusterRival, gameStateWithFatigue);
  assert.ok(typeof genreNonFatigued === "string");
});

test("AI Engine: Franchise and Sequel Generation", () => {
  const franchiseRival = {
    personality: AI_STRATEGIES.FRANCHISE_FOCUSED,
    franchises: [{ name: "Shadow Realm", genre: "Sci-Fi", sequelCount: 1 }],
  };

  const concept = generateMovieConcept(franchiseRival, "Sci-Fi");
  assert.ok(concept.title.length > 0);
  if (concept.isSequel) {
    assert.equal(concept.franchiseName, "Shadow Realm");
    assert.equal(concept.sequelNumber, 2);
  }
});

test("AI Engine: Talent Scouting Calibration", () => {
  const prestigeRival = { personality: AI_STRATEGIES.PRESTIGE };
  const talent = scoutTalentPackage(prestigeRival, 5000000);

  assert.ok(talent.directorName);
  assert.ok(talent.leadActorName);
  assert.ok(talent.directorSkill >= 50 && talent.directorSkill <= 100);
  assert.ok(talent.starPower >= 40 && talent.starPower <= 100);
});

test("AI Engine: Autonomous Movie Greenlighting and Budget Allocation", () => {
  const rival = {
    id: "rival-test-1",
    name: "Apex Pictures",
    personality: AI_STRATEGIES.BLOCKBUSTER,
    money: 10000000,
  };
  const gameState = { currentWeek: 10, activeMovies: [] };

  const initialMoney = rival.money;
  const project = decideAndGreenlightMovie(rival, gameState);

  assert.ok(project);
  assert.ok(project.title);
  assert.ok(project.budget >= 4000000);
  assert.ok(project.scheduledReleaseWeek > 10);
  assert.ok(rival.money < initialMoney);
  assert.equal(project.phase, "PRE_PRODUCTION");
});

test("AI Engine: Financial Distress and Turnaround Restructuring", () => {
  const distressedRival = {
    id: "rival-broke",
    name: "Broke Films",
    personality: AI_STRATEGIES.INDIE,
    money: 50000,
    prestige: 25,
  };

  processRivalFinancials(distressedRival);
  assert.ok(
    distressedRival.status === "BANKRUPTCY_RISK" ||
      distressedRival.status === "RESTRUCTURED"
  );
});

test("AI Engine: Simulation Tick with Rival Studio Autonomous Cycles", () => {
  const gameState = {
    currentWeek: 1,
    rivalStudiosInitialized: false,
    rivalStudios: [],
    notifications: [],
  };

  generateRivalStudios(gameState);
  assert.equal(gameState.rivalStudios.length, 4);
  assert.equal(gameState.rivalStudiosInitialized, true);

  // Run 30 weeks of simulation
  for (let week = 1; week <= 30; week += 1) {
    gameState.currentWeek = week;
    const releases = processRivalStudios(gameState);
    assert.ok(Array.isArray(releases));
  }

  // Confirm rival studios produced movies and updated stats
  const totalProduced = gameState.rivalStudios.reduce(
    (sum, r) => sum + (r.stats?.moviesReleased || 0) + (r.activeMovies?.length || 0),
    0
  );
  assert.ok(totalProduced > 0);
});
