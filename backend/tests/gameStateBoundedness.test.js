import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import GameState from "../src/models/GameState.js";
import Studio from "../src/models/Studio.js";
import Notification from "../src/models/Notification.js";
import TalentHistory from "../src/models/TalentHistory.js";
import PastAward from "../src/models/PastAward.js";
import Movie from "../src/models/Movie.js";
import { processAnnualAwards } from "../src/services/simulation/engines/awardsEngine.js";
import { getPastAwards, resetGame } from "../src/controllers/simulationController.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const createMockRes = () => {
  let statusCode = 200;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
    getStatus: () => statusCode,
    getData: () => responseData,
  };
  return res;
};

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

    await Movie.create({
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

  await t.test("processAnnualAwards propagates database errors when persistence fails", async () => {
    const invalidGameState = {
      _id: "invalid-id-not-object-id", // triggers CastError in PastAward.create
      currentWeek: 52,
    };
    const studio = { _id: new mongoose.Types.ObjectId(), stats: {}, prestige: 100 };

    await Movie.create({
      title: "Error Trigger Film",
      studioId: studio._id,
      scriptId: "script-err",
      directorId: "dir-err",
      leadActorId: "actor-err",
      crewTeamId: "crew-err",
      createdWeek: 1,
      status: "RELEASED",
      releaseWeek: 20,
      quality: 90,
      criticScore: 90,
      audienceScore: 90,
    });

    await assert.rejects(
      async () => {
        await processAnnualAwards(invalidGameState, studio);
      },
      (err) => {
        assert.ok(err, "Persistence error should propagate and not be silently caught");
        return true;
      }
    );
  });

  await t.test("getPastAwards reads externalized PastAward records with pagination", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const gameState = await GameState.create({
      user: userObjectId,
      currentWeek: 156,
    });

    for (let y = 1; y <= 5; y++) {
      await PastAward.create({
        gameStateId: gameState._id,
        year: y,
        bestPictureTitle: `Film Year ${y}`,
      });
    }

    const req = {
      user: { _id: userObjectId },
      query: { page: "1", limit: "2" },
    };
    const res = createMockRes();

    await getPastAwards(req, res);

    assert.strictEqual(res.getStatus(), 200);
    const data = res.getData();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.awards.length, 2);
    assert.strictEqual(data.awards[0].year, 5); // Sorted descending
    assert.strictEqual(data.awards[1].year, 4);
    assert.strictEqual(data.pagination.total, 5);
    assert.strictEqual(data.pagination.pages, 3);
  });

  await t.test("getPastAwards merges legacy embedded pastAwards for backward compatibility", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const gameState = await GameState.create({
      user: userObjectId,
      currentWeek: 104,
      pastAwards: [
        {
          year: 1,
          bestPictureTitle: "Legacy Award Film Year 1",
        },
      ],
    });

    // Create Year 2 in new PastAward collection
    await PastAward.create({
      gameStateId: gameState._id,
      year: 2,
      bestPictureTitle: "Modern Award Film Year 2",
    });

    const req = {
      user: { _id: userObjectId },
      query: {},
    };
    const res = createMockRes();

    await getPastAwards(req, res);

    assert.strictEqual(res.getStatus(), 200);
    const data = res.getData();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.awards.length, 2);
    assert.strictEqual(data.awards[0].year, 2);
    assert.strictEqual(data.awards[0].bestPictureTitle, "Modern Award Film Year 2");
    assert.strictEqual(data.awards[1].year, 1);
    assert.strictEqual(data.awards[1].bestPictureTitle, "Legacy Award Film Year 1");
  });

  await t.test("resetGame purges PastAward collection records", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const studio = await Studio.create({
      owner: userObjectId,
      name: "Studio To Reset",
      money: 5000000,
    });
    const gameState = await GameState.create({
      user: userObjectId,
      currentWeek: 52,
    });

    await PastAward.create({
      gameStateId: gameState._id,
      year: 1,
      bestPictureTitle: "Award Before Reset",
    });

    assert.strictEqual(await PastAward.countDocuments({ gameStateId: gameState._id }), 1);

    const req = {
      user: { _id: userObjectId },
    };
    const res = createMockRes();

    await resetGame(req, res);

    assert.strictEqual(res.getStatus(), 200);
    const remainingAwards = await PastAward.countDocuments({ gameStateId: gameState._id });
    assert.strictEqual(remainingAwards, 0, "Past awards should be deleted on resetGame");
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
