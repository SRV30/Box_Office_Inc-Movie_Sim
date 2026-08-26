import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import Composer from "../src/models/Composer.js";
import Studio from "../src/models/Studio.js";
import ComposerLifecycleEngine from "../src/services/composer/composerLifecycleEngine.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("Composer Lifecycle & Movie Music Impact - calculateGenreCompatibility", () => {
  const specialist = {
    musicalTalent: 80,
    versatility: 70,
    genreExpertise: ["Sci-Fi", "Action"],
  };

  const matchedScore = ComposerLifecycleEngine.calculateGenreCompatibility(specialist, "Sci-Fi");
  assert.ok(matchedScore >= 1.15, "Specialist should have compatibility multiplier >= 1.15");

  const unmatchedScore = ComposerLifecycleEngine.calculateGenreCompatibility(specialist, "Romance");
  assert.ok(unmatchedScore <= 1.0, "Unmatched genre should have lower compatibility");
});

test("Composer Lifecycle & Movie Music Impact - calculateMovieMusicImpact", () => {
  const composer = {
    musicalTalent: 90,
    versatility: 80,
    popularity: 85,
    genreExpertise: ["Drama"],
  };

  const impact = ComposerLifecycleEngine.calculateMovieMusicImpact(composer, "Drama", 20000000);
  assert.ok(impact.qualityBoost >= 8);
  assert.ok(impact.audienceScoreBonus >= 5);
  assert.ok(impact.soundtrackRoyalties > 0);
  assert.equal(impact.criticScoreModifier, 5);
});

test("Composer Lifecycle & Movie Music Impact - processMovieReleaseProgression", async () => {
  const composer = await Composer.create({
    name: "Hans Zimmerman",
    age: 45,
    musicalTalent: 70,
    versatility: 75,
    popularity: 60,
    salary: 100000,
    genreExpertise: ["Sci-Fi"],
  });

  const updated = await ComposerLifecycleEngine.processMovieReleaseProgression(composer._id, {
    boxOfficeHit: true,
    awardWon: { name: "Best Original Score", category: "Music", year: 2026 },
    reviewScore: 88,
  });

  assert.equal(updated.scoresComposed, 1);
  assert.equal(updated.hitScores, 1);
  assert.ok(updated.popularity > 60);
  assert.ok(updated.musicalTalent > 70);
  assert.ok(updated.salary > 100000);
  assert.equal(updated.awards.length, 1);
});

test("Composer Lifecycle & Movie Music Impact - processWeeklyTick aging and retirement", async () => {
  const elderComposer = await Composer.create({
    name: "John Williamsen",
    age: 72,
    musicalTalent: 95,
    versatility: 90,
    status: "AVAILABLE",
  });

  // Run tick on week 52 (annual boundary)
  const tickResult = await ComposerLifecycleEngine.processWeeklyTick(52);
  assert.equal(tickResult.isNewYear, true);
  assert.ok(tickResult.processedCount >= 2);
});
