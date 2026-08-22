import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import Studio from "../src/models/Studio.js";
import GameState from "../src/models/GameState.js";
import Movie from "../src/models/Movie.js";
import { withTransaction } from "../src/utils/financeTransactionHelper.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

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

    const gameState = await GameState.create({
      user: userObjectId,
      currentWeek: 10,
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
});
