import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import Studio from "../src/models/Studio.js";
import GameState from "../src/models/GameState.js";
import Movie from "../src/models/Movie.js";
import StudioFacility from "../src/models/StudioFacility.js";
import TalentAgency from "../src/models/TalentAgency.js";
import Notification from "../src/models/Notification.js";
import { withTransaction } from "../src/utils/financeTransactionHelper.js";
import { buildFacility } from "../src/controllers/facilityController.js";
import { boostMerchandiseLevel } from "../src/controllers/merchController.js";
import { buyoutContract } from "../src/controllers/contractController.js";
import { signAgencyPackage } from "../src/controllers/agencyController.js";
import { hireWriter } from "../src/controllers/writerController.js";

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

test("MongoDB Transaction atomicity and rollback for multi-document operations", async (t) => {
  await t.test("withTransaction commits changes when all operations succeed", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const studio = await Studio.create({
      owner: userObjectId,
      name: "Transaction Test Studio",
      money: 1000000,
    });

    const gameState = await GameState.create({
      user: userObjectId,
      currentWeek: 1,
    });

    await withTransaction(async (session) => {
      const s = await Studio.findById(studio._id).session(session);
      s.money -= 200000;
      await s.save({ session });

      const g = await GameState.findById(gameState._id).session(session);
      g.currentWeek = 2;
      await g.save({ session });
    });

    const updatedStudio = await Studio.findById(studio._id);
    const updatedGameState = await GameState.findById(gameState._id);

    assert.strictEqual(updatedStudio.money, 800000);
    assert.strictEqual(updatedGameState.currentWeek, 2);
  });

  await t.test("withTransaction rolls back all modifications when an operation throws", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const studio = await Studio.create({
      owner: userObjectId,
      name: "Rollback Test Studio",
      money: 5000000,
    });

    let caughtError = null;

    try {
      await withTransaction(async (session) => {
        const s = await Studio.findById(studio._id).session(session);
        s.money -= 1000000;
        await s.save({ session });

        // Simulate an unexpected error before committing
        throw new Error("Simulated failure in multi-document flow");
      });
    } catch (err) {
      caughtError = err;
    }

    assert.ok(caughtError);
    assert.strictEqual(caughtError.message, "Simulated failure in multi-document flow");

    // Studio money should NOT have been deducted
    const reloadedStudio = await Studio.findById(studio._id);
    assert.strictEqual(reloadedStudio.money, 5000000);
  });

  await t.test("Facility build rolls back Studio balance and Facility creation on failure", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const studio = await Studio.create({
      owner: userObjectId,
      name: "Facility Rollback Studio",
      money: 10000000,
    });

    // Attempt building facility with invalid type to trigger validation error after deduction inside transaction
    const req = {
      user: { _id: userObjectId, studioId: studio._id },
      body: { facilityType: "INVALID_FACILITY_TYPE" },
    };
    const res = createMockRes();

    let errorThrown = null;
    await buildFacility(req, res, (err) => {
      errorThrown = err;
    });

    // Verify Studio money was rolled back and facility was not created
    const reloadedStudio = await Studio.findById(studio._id);
    assert.strictEqual(reloadedStudio.money, 10000000);

    const facilities = await StudioFacility.find({ studioId: studio._id });
    assert.strictEqual(facilities.length, 0);
  });

  await t.test("Merchandise boost rolls back Movie and Studio balance on error", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const studio = await Studio.create({
      owner: userObjectId,
      name: "Merch Rollback Studio",
      money: 10000000,
    });

    const movie = await Movie.create({
      title: "Merch Test Movie",
      studioId: studio._id,
      scriptId: "script-m1",
      directorId: "dir-m1",
      leadActorId: "act-m1",
      crewTeamId: "crew-m1",
      createdWeek: 1,
      status: "RELEASED",
      releaseWeek: 5,
      quality: 80,
      criticScore: 80,
      audienceScore: 80,
      merchandiseLevel: 1,
    });

    // Insufficient funds scenario should not mutate movie or studio
    studio.money = 500000; // Less than MERCH_BOOST_COST (2.5M)
    await studio.save();

    const req = {
      user: { _id: userObjectId },
      params: { movieId: movie._id.toString() },
    };
    const res = createMockRes();

    await boostMerchandiseLevel(req, res);

    assert.strictEqual(res.getStatus(), 400);
    const reloadedMovie = await Movie.findById(movie._id);
    assert.strictEqual(reloadedMovie.merchandiseLevel, 1);

    const reloadedStudio = await Studio.findById(studio._id);
    assert.strictEqual(reloadedStudio.money, 500000);
  });

  await t.test("Contract buyout rolls back Studio money deduction and Contract status change on error", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const studio = await Studio.create({
      owner: userObjectId,
      name: "Contract Studio",
      money: 50000, // Insufficient for buyout penalty (150,000)
    });

    const contractId = new mongoose.Types.ObjectId().toString();
    const gameState = await GameState.create({
      user: userObjectId,
      currentWeek: 5,
      pendingContracts: [
        {
          _id: contractId,
          talentId: "talent-c1",
          talentType: "ACTOR",
          talentName: "Star Actor",
          offer: { baseSalary: 100000, backendPoints: 5, movieCount: 2 },
          status: "ACCEPTED",
        },
      ],
    });

    const req = {
      user: { _id: userObjectId },
      body: { contractId },
    };
    const res = createMockRes();

    await buyoutContract(req, res);

    assert.strictEqual(res.getStatus(), 400);

    // Verify neither studio balance nor contract status changed
    const reloadedStudio = await Studio.findById(studio._id);
    assert.strictEqual(reloadedStudio.money, 50000);

    const reloadedGameState = await GameState.findById(gameState._id);
    assert.strictEqual(reloadedGameState.pendingContracts[0].status, "ACCEPTED");
  });

  await t.test("Talent agency package signing rolls back Studio funds on failure", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const studio = await Studio.create({
      owner: userObjectId,
      name: "Agency Studio",
      money: 50000, // Insufficient for package deal
    });

    const req = {
      user: { _id: userObjectId, studioId: studio._id },
      body: { agencyName: "CAA", packageValue: 1000000, talentCount: 3 },
    };
    const res = createMockRes();

    let errorThrown = null;
    await signAgencyPackage(req, res, (err) => {
      errorThrown = err;
    });

    // Should return 400 or pass 400 error
    const reloadedStudio = await Studio.findById(studio._id);
    assert.strictEqual(reloadedStudio.money, 50000);
  });

  await t.test("Writer hire rolls back GameState talent arrays and Studio money on error", async () => {
    const userObjectId = new mongoose.Types.ObjectId();
    const studio = await Studio.create({
      owner: userObjectId,
      name: "Writer Studio",
      money: 50000, // Insufficient for writer fee (100,000)
    });

    const gameState = await GameState.create({
      user: userObjectId,
      currentWeek: 1,
      marketWriters: [
        {
          id: "writer-w1",
          name: "Talented Writer",
          salary: 50000,
          status: "AVAILABLE",
        },
      ],
      ownedWriters: [],
    });

    const req = {
      user: { _id: userObjectId },
      params: { index: "0" },
    };
    const res = createMockRes();

    await hireWriter(req, res);

    assert.strictEqual(res.getStatus(), 400);

    const reloadedStudio = await Studio.findById(studio._id);
    assert.strictEqual(reloadedStudio.money, 50000);

    const reloadedGameState = await GameState.findById(gameState._id);
    assert.strictEqual(reloadedGameState.ownedWriters.length, 0);
    assert.strictEqual(reloadedGameState.marketWriters.length, 1);
  });
});
