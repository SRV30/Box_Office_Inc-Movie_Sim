import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import GameState from "../src/models/GameState.js";
import Studio from "../src/models/Studio.js";
import Notification from "../src/models/Notification.js";
import TalentHistory from "../src/models/TalentHistory.js";
import PastAward from "../src/models/PastAward.js";
import { processAnnualAwards } from "../src/services/simulation/engines/awardsEngine.js";
import Movie from "../src/models/Movie.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("GameState BSON Bounded Growth and Decoupled History Storage", async (t) => {
  await t.test("PastAward collection stores awards without growing GameState document", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const studio = await Studio.create({
      owner: userObjectId,
      name: "Award Winning Studio",
      money: 10000000,
      prestige: 100,
      fans: 1000,
    });

    const gameState = await GameState.create({
      user: userObjectId,
      currentWeek: 52,
    });

    const movie = await Movie.create({
      title: "Masterpiece Film",
      studioId: studio._id,
      scriptId: "script-1",
      directorId: "dir-1",
      directorName: "Great Director",
      leadActorId: "act-1",
      leadActorName: "Great Actor",
      crewTeamId: "crew-1",
      createdWeek: 1,
      status: "RELEASED",
      releaseWeek: 20,
      quality: 95,
      criticScore: 95,
      audienceScore: 95,
      criticLabel: "Masterpiece",
    });

    // Run annual awards
    await processAnnualAwards(gameState, studio);

    // Verify award is stored in PastAward collection
    const awardsInDb = await PastAward.find({ gameStateId: gameState._id });
    assert.strictEqual(awardsInDb.length, 1);
    assert.strictEqual(awardsInDb[0].year, 1);
    assert.strictEqual(awardsInDb[0].bestPictureTitle, "Masterpiece Film");

    // Verify GameState document does not have unbounded embedded array growth
    const savedGameState = await GameState.findById(gameState._id).lean();
    assert.strictEqual(savedGameState.pastAwards, undefined);
  });

  await t.test("Long-play simulation keeps GameState BSON size compact under 100KB", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const gameState = await GameState.create({
      user: userObjectId,
      currentWeek: 1,
    });

    // Simulate 300 weeks of historical data insertions
    const notifications = [];
    const histories = [];
    for (let w = 1; w <= 300; w++) {
      notifications.push({
        gameStateId: gameState._id,
        type: "SYSTEM",
        message: `Notification for week ${w}`,
        read: false,
      });

      histories.push({
        gameStateId: gameState._id,
        talentId: `talent-${w % 10}`,
        type: "CAREER",
        data: { week: w, event: "Completed project" },
      });
    }

    await Notification.insertMany(notifications);
    await TalentHistory.insertMany(histories);

    // Fetch GameState document and measure serialized BSON size
    const reloaded = await GameState.findById(gameState._id).lean();
    const serialized = JSON.stringify(reloaded);
    const sizeInBytes = Buffer.byteLength(serialized, "utf8");

    // Ensure GameState document remains comfortably below 100KB (and safely far from 16MB)
    assert.ok(sizeInBytes < 100 * 1024, `GameState size (${sizeInBytes} bytes) should be < 100KB`);
  });
});
