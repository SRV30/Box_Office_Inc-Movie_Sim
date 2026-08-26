import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import IndustryMarketSeeder from "../src/services/seeder/industryMarketSeeder.js";
import RivalStudio from "../src/models/RivalStudio.js";
import MarketActor from "../src/models/MarketActor.js";
import MarketDirector from "../src/models/MarketDirector.js";
import Composer from "../src/models/Composer.js";
import GameState from "../src/models/GameState.js";

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

test("V1 Industry Market Seeder - Deterministic Generators", () => {
  const studios = IndustryMarketSeeder.generateStudios();
  assert.equal(studios.length, 99, "Should generate exactly 99 studios");
  assert.equal(studios[0].name, "Apex Global Pictures", "First studio should be top industry giant");

  const actors = IndustryMarketSeeder.generateActors(new mongoose.Types.ObjectId(), 1000);
  assert.equal(actors.length, 1000, "Should generate 1000 actors");
  assert.ok(actors[0].name.length > 3);
  assert.ok(actors[0].salary >= 25000);

  const writers = IndustryMarketSeeder.generateWriters(500);
  assert.equal(writers.length, 500, "Should generate 500 writers");

  const directors = IndustryMarketSeeder.generateDirectors(new mongoose.Types.ObjectId(), 300);
  assert.equal(directors.length, 300, "Should generate 300 directors");

  const composers = IndustryMarketSeeder.generateComposers(300);
  assert.equal(composers.length, 300, "Should generate 300 composers");
});

test("V1 Industry Market Seeder - seedFullIndustryMarket idempotency and execution", async () => {
  const userId = new mongoose.Types.ObjectId();

  await GameState.create({
    user: userId,
    studioName: "Benchmark Studios",
  });

  // Run 1: Initial seeding
  const report1 = await IndustryMarketSeeder.seedFullIndustryMarket(userId);
  assert.equal(report1.aiStudiosCreated, 99);
  assert.equal(report1.actorsCreated, 1000);
  assert.equal(report1.writersCreated, 500);
  assert.equal(report1.directorsCreated, 300);
  assert.equal(report1.composersCreated, 300);

  const studioCount = await RivalStudio.countDocuments();
  assert.equal(studioCount, 99);

  const actorCount = await MarketActor.countDocuments({ userId });
  assert.equal(actorCount, 1000);

  const directorCount = await MarketDirector.countDocuments({ userId });
  assert.equal(directorCount, 300);

  const composerCount = await Composer.countDocuments();
  assert.equal(composerCount, 300);

  const gameState = await GameState.findOne({ user: userId });
  assert.equal(gameState.marketWriters.length, 500);

  // Run 2: Re-run should be idempotent without duplicate key errors or count blowups
  const report2 = await IndustryMarketSeeder.seedFullIndustryMarket(userId);
  assert.equal(report2.aiStudiosCreated, 99);
  assert.equal(await RivalStudio.countDocuments(), 99);
  assert.equal(await MarketActor.countDocuments({ userId }), 1000);
});
