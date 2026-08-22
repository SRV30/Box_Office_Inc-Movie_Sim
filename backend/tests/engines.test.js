import test from "node:test";
import assert from "node:assert";

import { generateReviews } from "../src/services/simulation/engines/reviewEngine.js";
import { processCareerImpact } from "../src/services/simulation/engines/careerImpactEngine.js";
import { processWriterPayroll } from "../src/services/simulation/engines/payrollEngine.js";
import { processStudioGrowth } from "../src/services/simulation/engines/studioGrowthEngine.js";
import { VERDICTS } from "../src/constants/verdicts.js";
import { escapeRegex, matchFranchiseTitle } from "../src/services/simulation/engines/franchiseEngine.js";

// ---------------------------------------------------------------------------
// reviewEngine.generateReviews — pure, no side effects
// ---------------------------------------------------------------------------

test("reviewEngine: neutral (all 50) stats produce 50/Average scores", () => {
  const result = generateReviews(
    { quality: 50 },
    { quality: 50, audienceAppeal: 50 },
    { creativity: 50, reputation: 50 },
    { actingSkill: 50, popularity: 50 },
    { technicalQuality: 50 }
  );
  // critic = 50*0.4 + 50*0.3 + 50*0.2 + 50*0.1 = 50
  // audience = 50*0.35 + 50*0.25 + 50*0.2 + 50*0.2 = 50
  assert.strictEqual(result.criticScore, 50);
  assert.strictEqual(result.audienceScore, 50);
  assert.strictEqual(result.criticLabel, "Average");
  assert.strictEqual(result.audienceLabel, "Average");
});

test("reviewEngine: top stats produce 100/Excellent (and never exceed 100)", () => {
  const result = generateReviews(
    { quality: 100 },
    { quality: 100, audienceAppeal: 100 },
    { creativity: 100, reputation: 100 },
    { actingSkill: 100, popularity: 100 },
    { technicalQuality: 100 }
  );
  assert.strictEqual(result.criticScore, 100);
  assert.strictEqual(result.audienceScore, 100);
  assert.ok(result.criticScore <= 100 && result.audienceScore <= 100);
  assert.strictEqual(result.criticLabel, "Excellent");
  assert.strictEqual(result.audienceLabel, "Excellent");
});

test("reviewEngine: zero stats produce 0/Terrible", () => {
  const result = generateReviews(
    { quality: 0 },
    { quality: 0, audienceAppeal: 0 },
    { creativity: 0, reputation: 0 },
    { actingSkill: 0, popularity: 0 },
    { technicalQuality: 0 }
  );
  assert.strictEqual(result.criticScore, 0);
  assert.strictEqual(result.audienceScore, 0);
  assert.strictEqual(result.criticLabel, "Terrible");
  assert.strictEqual(result.audienceLabel, "Terrible");
});

test("reviewEngine: label thresholds (Poor and Good boundaries)", () => {
  // critic = 75*0.4 + 0 + 0 + 0 = 30 -> Poor (<= 40)
  const poor = generateReviews(
    { quality: 0 },
    { quality: 75 },
    { creativity: 0 },
    { actingSkill: 0 },
    { technicalQuality: 0 }
  );
  assert.strictEqual(poor.criticScore, 30);
  assert.strictEqual(poor.criticLabel, "Poor");

  // critic = 100*0.4 + 100*0.3 + 0 + 0 = 70 -> Good (<= 80)
  const good = generateReviews(
    { quality: 0 },
    { quality: 100 },
    { creativity: 100 },
    { actingSkill: 0 },
    { technicalQuality: 0 }
  );
  assert.strictEqual(good.criticScore, 70);
  assert.strictEqual(good.criticLabel, "Good");
});

test("reviewEngine: missing talent defaults to neutral without throwing", () => {
  const result = generateReviews({}, undefined, undefined, undefined, undefined);
  assert.strictEqual(result.criticScore, 50);
  assert.strictEqual(result.audienceScore, 50);
});

test("reviewEngine: corrupt/string/null/missing crew values do not produce NaN", () => {
  const result = generateReviews(
    { quality: null },
    { quality: "60", audienceAppeal: "" },
    { creativity: null, reputation: undefined },
    { actingSkill: "abc", popularity: 50 },
    { technicalQuality: undefined }
  );
  assert.ok(!isNaN(result.criticScore));
  assert.ok(!isNaN(result.audienceScore));
  assert.strictEqual(typeof result.criticLabel, "string");
  assert.strictEqual(typeof result.audienceLabel, "string");
});


// ---------------------------------------------------------------------------
// careerImpactEngine.processCareerImpact — mutates talent objects in place
// ---------------------------------------------------------------------------

test("careerImpactEngine: a HIT raises stats, salary, earnings and history", () => {
  const gameState = { currentWeek: 5 };
  const movie = {
    verdict: VERDICTS.HIT,
    worldwideGross: 1_000_000,
    quality: 60,
    _id: "movie-1",
    title: "The Big One",
  };
  const leadActor = {
    id: "actor-1",
    popularity: 50,
    salary: 1000,
    fanbase: 0,
    hitMovies: 0,
  };
  const director = { id: "director-1", reputation: 50, salary: 1000 };

  processCareerImpact(gameState, movie, null, director, leadActor, null);

  // HIT => repChange +5, salary x1.1, earnings += gross*0.001
  assert.strictEqual(leadActor.popularity, 55);
  assert.strictEqual(leadActor.salary, 1100);
  assert.strictEqual(leadActor.hitMovies, 1);
  assert.strictEqual(leadActor.fanbase, 5000); // 5 * 1_000_000 * 0.001
  assert.strictEqual(leadActor.careerEarnings, 1000); // 1_000_000 * 0.001
  
  assert.strictEqual(gameState._pendingTalentHistories.length, 2);
  assert.strictEqual(gameState._pendingTalentHistories[0].talentId, "director-1");
  assert.strictEqual(gameState._pendingTalentHistories[0].data.verdict, VERDICTS.HIT);
  assert.strictEqual(gameState._pendingTalentHistories[1].talentId, "actor-1");
  assert.strictEqual(gameState._pendingTalentHistories[1].data.verdict, VERDICTS.HIT);

  assert.strictEqual(director.reputation, 55);
  assert.strictEqual(director.salary, 1100);
});

test("careerImpactEngine: a DISASTER lowers popularity and salary", () => {
  const gameState = { currentWeek: 3 };
  const movie = {
    verdict: VERDICTS.DISASTER,
    worldwideGross: 100_000,
    quality: 30,
    _id: "movie-2",
    title: "The Flopbuster",
  };
  const leadActor = { popularity: 50, salary: 1000, careerHistory: [] };

  processCareerImpact(gameState, movie, null, null, leadActor, null);

  assert.strictEqual(leadActor.popularity, 35); // 50 - 15
  assert.strictEqual(leadActor.salary, 750); // 1000 * 0.75
  assert.strictEqual(leadActor.flopMovies, 1);
});

test("careerImpactEngine: AVERAGE leaves stats and salary unchanged", () => {
  const gameState = { currentWeek: 1 };
  const movie = { verdict: VERDICTS.AVERAGE, worldwideGross: 0, quality: 50, _id: "m", title: "Mid" };
  const director = { reputation: 50, salary: 1000, careerHistory: [] };

  processCareerImpact(gameState, movie, null, director, null, null);

  assert.strictEqual(director.reputation, 50);
  assert.strictEqual(director.salary, 1000);
});

test("careerImpactEngine: null talent slots do not throw", () => {
  const gameState = { currentWeek: 1 };
  const movie = { verdict: VERDICTS.HIT, worldwideGross: 1000, quality: 50, _id: "m", title: "T" };
  assert.doesNotThrow(() =>
    processCareerImpact(gameState, movie, null, null, null, null)
  );
});

// ---------------------------------------------------------------------------
// payrollEngine.processWriterPayroll — deducts salaries from studio money
// ---------------------------------------------------------------------------

test("payrollEngine: full coverage deducts total payroll and credits earnings", () => {
  const gameState = {
    ownedWriters: [],
    ownedDirectors: [],
    ownedActors: [
      { salary: 1000, totalEarnings: 0 },
      { salary: 1000, totalEarnings: 0 },
    ],
    ownedCrewTeams: [],
  };
  const studio = { money: 100_000 };

  const paid = processWriterPayroll(gameState, studio);

  assert.strictEqual(paid, 2000);
  assert.strictEqual(studio.money, 98_000); // 100000 - 2000
  assert.strictEqual(gameState.ownedActors[0].totalEarnings, 1000);
  assert.strictEqual(gameState.ownedActors[1].totalEarnings, 1000);
});

test("payrollEngine: underfunded studio pays partial, floors money at 0, warns", () => {
  const gameState = {
    ownedWriters: [],
    ownedDirectors: [],
    ownedActors: [{ salary: 1000, totalEarnings: 0 }],
    ownedCrewTeams: [],
  };
  const studio = { money: 500 };

  processWriterPayroll(gameState, studio);

  assert.strictEqual(studio.money, 0); // max(0, 500 - 1000)
  assert.strictEqual(gameState.ownedActors[0].totalEarnings, 500); // floor(1000 * 0.5)
  assert.ok(
    Array.isArray(gameState._pendingNotifications) &&
      gameState._pendingNotifications.length >= 1,
    "an affordability warning should be queued"
  );
});

test("payrollEngine: partial payment deducts only what was actually paid, not the full payroll", () => {
  const gameState = {
    ownedWriters: [],
    ownedDirectors: [],
    ownedActors: [
      { salary: 50, totalEarnings: 0 },
      { salary: 50, totalEarnings: 0 },
      { salary: 50, totalEarnings: 0 },
    ],
    ownedCrewTeams: [],
  };
  const studio = { money: 100 }; // payroll = 150, coverage = 100 / 150

  processWriterPayroll(gameState, studio);

  // Each talent is paid floor(50 * 0.6667) = 33, so 99 is actually paid out.
  // The studio should lose only that 99 and keep the 1 it never spent,
  // instead of being deducted the full 150 and wiped to 0.
  assert.strictEqual(gameState.ownedActors[0].totalEarnings, 33);
  assert.strictEqual(gameState.ownedActors[1].totalEarnings, 33);
  assert.strictEqual(gameState.ownedActors[2].totalEarnings, 33);
  assert.strictEqual(studio.money, 1);
});

test("payrollEngine: no talent is a no-op", () => {
  const gameState = {
    ownedWriters: [],
    ownedDirectors: [],
    ownedActors: [],
    ownedCrewTeams: [],
  };
  const studio = { money: 5000 };
  processWriterPayroll(gameState, studio);
  assert.strictEqual(studio.money, 5000);
});

// ---------------------------------------------------------------------------
// studioGrowthEngine.processStudioGrowth — fans/prestige/stats after release
// (no rivalStudios => market penalty is a neutral 1.0)
// ---------------------------------------------------------------------------

test("studioGrowthEngine: a HIT grows fans, prestige, money and stats", () => {
  const gameState = {};
  const studio = { money: 0, fans: 0, prestige: 0, studioLevel: 1 };
  const movie = {
    verdict: VERDICTS.HIT,
    worldwideGross: 1_000_000,
    profit: 200_000,
    audienceScore: 80,
    criticScore: 70,
    quality: 60,
    _id: "movie-1",
    title: "Smash",
  };

  const result = processStudioGrowth(gameState, studio, movie);

  // fanGain = round(1000 * 0.8 * 2) * 1.0 = 1600
  assert.strictEqual(result.fanGain, 1600);
  assert.strictEqual(studio.fans, 1600);
  // prestigeGain = round(0.7*10 + 0.6*5 + 20) = 30
  assert.strictEqual(result.prestigeGain, 30);
  assert.strictEqual(studio.prestige, 30);
  assert.strictEqual(result.marketPenalty, 1);

  assert.strictEqual(studio.money, 200_000);
  assert.strictEqual(studio.stats.moviesReleased, 1);
  assert.strictEqual(studio.stats.hits, 1);
  assert.strictEqual(studio.stats.totalRevenue, 1_000_000);
  assert.strictEqual(studio.stats.totalProfit, 200_000);
  assert.strictEqual(studio.stats.avgCriticScore, 70);
  assert.strictEqual(studio.stats.avgAudienceScore, 80);
});

test("studioGrowthEngine: a FLOP shrinks prestige (floored at 0 overall) and counts a flop", () => {
  const gameState = {};
  const studio = { money: 1_000_000, fans: 1000, prestige: 100, studioLevel: 1 };
  const movie = {
    verdict: VERDICTS.FLOP,
    worldwideGross: 50_000,
    profit: -100_000,
    audienceScore: 30,
    criticScore: 25,
    quality: 40,
    _id: "movie-2",
    title: "Dud",
  };

  const result = processStudioGrowth(gameState, studio, movie);

  // fanGain = round(50 * 0.3 * 0.5) = 8
  assert.strictEqual(result.fanGain, 8);
  assert.strictEqual(studio.fans, 1008);
  // prestigeGain = round(2.5 + 2 - 10) = -5
  assert.strictEqual(result.prestigeGain, -5);
  assert.strictEqual(studio.prestige, 95);
  assert.strictEqual(studio.stats.flops, 1);
});

test("studioGrowthEngine: crossing the fan threshold levels the studio up", () => {
  const gameState = {};
  const studio = { money: 0, fans: 99_000, prestige: 0, studioLevel: 1 };
  const movie = {
    verdict: VERDICTS.HIT,
    worldwideGross: 1_000_000,
    profit: 0,
    audienceScore: 80,
    criticScore: 70,
    quality: 60,
    _id: "movie-3",
    title: "Level Up",
  };

  processStudioGrowth(gameState, studio, movie);

  // 99_000 + 1600 = 100_600 >= 1 * 100_000 -> level 2
  assert.strictEqual(studio.studioLevel, 2);
  assert.ok(
    Array.isArray(gameState._pendingNotifications) &&
      gameState._pendingNotifications.some((n) => /leveled up/i.test(n.message)),
    "a level-up notification should be queued"
  );
});

// ---------------------------------------------------------------------------
// franchiseEngine.escapeRegex & matchFranchiseTitle — escaping special characters
// ---------------------------------------------------------------------------

test("franchiseEngine: escapeRegex escapes special characters correctly", () => {
  assert.strictEqual(escapeRegex("Marvel [MCU]"), "Marvel \\[MCU\\]");
  assert.strictEqual(escapeRegex("Star Wars (Saga)"), "Star Wars \\(Saga\\)");
  assert.strictEqual(escapeRegex("James Bond 007?"), "James Bond 007\\?");
});

test("franchiseEngine: matchFranchiseTitle matches titles containing special characters", () => {
  assert.ok(matchFranchiseTitle("Marvel [MCU]: Iron Man", "Marvel [MCU]"));
  assert.ok(matchFranchiseTitle("Star Wars (Saga): A New Hope", "Star Wars (Saga)"));
  assert.ok(!matchFranchiseTitle("Star Trek: Nemesis", "Star Wars (Saga)"));
});
