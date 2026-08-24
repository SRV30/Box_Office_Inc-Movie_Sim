import test from "node:test";
import assert from "node:assert/strict";

import {
  CAREER_STAGES,
  STARDOM_TIERS,
  getActorCareerStage,
  calculateActorStardom,
  calculateActorDemand,
  calculateDynamicSalary,
  evolveActorStats,
  shouldActorRetire,
} from "../src/services/actor/actorLifecycleEngine.js";
import {
  archiveRetiredActor,
  ageMarketActorPool,
  ageOwnedActorPool,
} from "../src/services/simulation/engines/actorEngine.js";

test("Actor Lifecycle: Career Stage Classification", () => {
  // Emerging
  const youngActor = { age: 22, movies: 1, hitMovies: 0, popularity: 25 };
  assert.equal(getActorCareerStage(youngActor), CAREER_STAGES.EMERGING);

  // Established
  const establishedActor = { age: 34, movies: 5, hitMovies: 2, popularity: 55 };
  assert.equal(getActorCareerStage(establishedActor), CAREER_STAGES.ESTABLISHED);

  // Veteran
  const veteranActor = { age: 58, movies: 15, hitMovies: 6, popularity: 75 };
  assert.equal(getActorCareerStage(veteranActor), CAREER_STAGES.VETERAN);

  // Legacy
  const legacyActor = {
    age: 65,
    movies: 20,
    hitMovies: 10,
    awards: 4,
    boxOfficeTotal: 600000000,
    popularity: 90,
  };
  assert.equal(getActorCareerStage(legacyActor), CAREER_STAGES.LEGACY);
});

test("Actor Lifecycle: Stardom Calculation and Tiers", () => {
  const localTalent = { popularity: 15, fanbase: 5000, movies: 0, hitMovies: 0, awards: 0 };
  const starResult1 = calculateActorStardom(localTalent);
  assert.equal(starResult1.stardomTier, STARDOM_TIERS.LOCAL_TALENT);

  const risingStar = { popularity: 45, fanbase: 200000, movies: 3, hitMovies: 2, awards: 0 };
  const starResult2 = calculateActorStardom(risingStar);
  assert.equal(starResult2.stardomTier, STARDOM_TIERS.RISING_STAR);

  const superstar = {
    popularity: 92,
    fanbase: 1800000,
    movies: 12,
    hitMovies: 9,
    awards: 3,
    boxOfficeTotal: 500000000,
  };
  const starResult3 = calculateActorStardom(superstar);
  assert.ok(
    starResult3.stardomTier === STARDOM_TIERS.SUPERSTAR ||
      starResult3.stardomTier === STARDOM_TIERS.ICON
  );
  assert.ok(starResult3.stardomScore >= 70);
});

test("Actor Lifecycle: Demand and Dynamic Salary Calculations", () => {
  const flopActor = { popularity: 30, hitMovies: 0, flopMovies: 4, awards: 0, salary: 50000 };
  const flopDemand = calculateActorDemand(flopActor);
  assert.ok(flopDemand < 1.0);

  const hitActor = {
    popularity: 85,
    hitMovies: 6,
    flopMovies: 1,
    awards: 2,
    salary: 200000,
    boxOfficeTotal: 300000000,
    fanbase: 1000000,
  };
  const hitDemand = calculateActorDemand(hitActor);
  assert.ok(hitDemand > 1.2);

  const dynamicSalary = calculateDynamicSalary(hitActor);
  assert.ok(dynamicSalary >= hitActor.salary);
});

test("Actor Lifecycle: Retirement Rules and Probability", () => {
  const young = { age: 40 };
  assert.equal(shouldActorRetire(young), false);

  const veryOld = { age: 75 };
  assert.equal(shouldActorRetire(veryOld), true);

  // Age 65 should probabilistically return boolean without errors
  const senior = { age: 65 };
  const result = shouldActorRetire(senior);
  assert.equal(typeof result, "boolean");
});

test("Actor Lifecycle: Deferred Retirement for Active Movies and Contracts", () => {
  const gameState = { currentWeek: 52, retiredActors: [], notifications: [] };
  const seniorActor = {
    id: "actor-123",
    name: "Senior Star",
    age: 74, // would normally retire
    status: "AVAILABLE",
    salary: 100000,
  };

  // 1. Without active cast or contract -> retires
  const pool1 = [JSON.parse(JSON.stringify(seniorActor))];
  const res1 = ageOwnedActorPool({
    actors: pool1,
    gameState,
    activeMovieActorIds: new Set(),
    activeContractActorIds: new Set(),
  });
  assert.equal(res1.activeActors.length, 0);
  assert.equal(res1.retiredCount, 1);
  assert.equal(gameState.retiredActors.length, 1);

  // 2. With active movie -> deferred
  const pool2 = [JSON.parse(JSON.stringify(seniorActor))];
  const res2 = ageOwnedActorPool({
    actors: pool2,
    gameState,
    activeMovieActorIds: new Set(["actor-123"]),
    activeContractActorIds: new Set(),
  });
  assert.equal(res2.activeActors.length, 1);
  assert.equal(res2.retiredCount, 0);

  // 3. With active contract -> deferred
  const pool3 = [JSON.parse(JSON.stringify(seniorActor))];
  const res3 = ageMarketActorPool({
    actors: pool3,
    gameState,
    activeContractActorIds: new Set(["actor-123"]),
  });
  assert.equal(res3.activeActors.length, 1);
  assert.equal(res3.retiredCount, 0);
});

test("Actor Lifecycle: Multi-Decade Simulation Longevity", () => {
  const gameState = { currentWeek: 0, retiredActors: [], notifications: [] };
  let testActor = {
    id: "actor-longplay",
    name: "Legend Protagonist",
    age: 20,
    actingSkill: 45,
    hiddenPotential: 90,
    reliability: 60,
    popularity: 30,
    fanbase: 10000,
    salary: 40000,
    movies: 0,
    hitMovies: 0,
    flopMovies: 0,
    awards: 0,
    boxOfficeTotal: 0,
  };

  // Simulate 30 years (1560 weeks)
  for (let year = 1; year <= 30; year += 1) {
    gameState.currentWeek = year * 52;
    testActor.age += 1;
    evolveActorStats(testActor);

    // Simulate occasional hits
    if (year % 3 === 0) {
      testActor.movies += 1;
      testActor.hitMovies += 1;
      testActor.popularity = Math.min(100, testActor.popularity + 8);
      testActor.fanbase += 200000;
      testActor.boxOfficeTotal += 80000000;
    }

    testActor.salary = calculateDynamicSalary(testActor);

    // Verify bounded stats
    assert.ok(testActor.actingSkill >= 0 && testActor.actingSkill <= 100);
    assert.ok(testActor.reliability >= 0 && testActor.reliability <= 100);
    assert.ok(testActor.popularity >= 0 && testActor.popularity <= 100);
    assert.ok(testActor.salary >= 15000);
  }

  // At age 50 after 30 years and 10 hits, stage should be Veteran or Legacy
  const stage = getActorCareerStage(testActor);
  assert.ok(stage === CAREER_STAGES.VETERAN || stage === CAREER_STAGES.LEGACY);
});
