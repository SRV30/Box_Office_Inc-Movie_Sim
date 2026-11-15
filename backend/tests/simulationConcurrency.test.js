import "./helpers/testEnv.js";

import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import User from "../src/models/User.js";
import Studio from "../src/models/Studio.js";
import GameState from "../src/models/GameState.js";
import { simulateWeek } from "../src/controllers/simulationController.js";

let mongod;
let testUser;
let testStudio;
let testGameState;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Studio.deleteMany({});
  await GameState.deleteMany({});

  testUser = await User.create({
    username: "sim_tester",
    email: "sim@example.com",
    password: "password123",
  });

  testStudio = await Studio.create({
    name: "Sim Studio",
    owner: testUser._id,
    money: 10_000_000,
    fans: 1000,
    prestige: 50,
  });

  testGameState = await GameState.create({
    user: testUser._id,
    currentWeek: 5,
    lastSimulatedWeek: 4,
    ownedDirectors: [],
    ownedActors: [],
    ownedCrewTeams: [],
    ownedScripts: [],
  });
});

test("rejects concurrent simulation ticks for the same studio with 409", async () => {
  // Simulate an in-flight lock
  testGameState.isSimulating = true;
  testGameState.simulatingLockedAt = new Date();
  await testGameState.save();

  let statusCode = null;
  let responseBody = null;

  const req = {
    user: testUser,
    body: { weeks: 1 },
    headers: {},
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
  };

  await simulateWeek(req, res);

  assert.strictEqual(statusCode, 409);
  assert.strictEqual(responseBody?.success, false);
  assert.ok(responseBody?.message?.includes("already in progress"));

  // Verify currentWeek was NOT advanced
  const freshState = await GameState.findOne({ user: testUser._id });
  assert.strictEqual(freshState.currentWeek, 5);
});

test("returns deterministic replay when same idempotency key is retried", async () => {
  const idempotencyKey = "client-tx-12345";

  let firstStatusCode = null;
  let firstResponseBody = null;

  const req1 = {
    user: testUser,
    body: { weeks: 1 },
    headers: { "idempotency-key": idempotencyKey },
  };

  const res1 = {
    status(code) {
      firstStatusCode = code;
      return this;
    },
    json(data) {
      firstResponseBody = data;
      return this;
    },
  };

  await simulateWeek(req1, res1);

  assert.strictEqual(firstStatusCode, 200);
  assert.strictEqual(firstResponseBody?.currentWeek, 6);

  // Send exact same request with same idempotency key
  let retryStatusCode = null;
  let retryResponseBody = null;

  const req2 = {
    user: testUser,
    body: { weeks: 1 },
    headers: { "idempotency-key": idempotencyKey },
  };

  const res2 = {
    status(code) {
      retryStatusCode = code;
      return this;
    },
    json(data) {
      retryResponseBody = data;
      return this;
    },
  };

  await simulateWeek(req2, res2);

  assert.strictEqual(retryStatusCode, 200);
  assert.strictEqual(retryResponseBody?.idempotentReplay, true);
  assert.strictEqual(retryResponseBody?.currentWeek, 6);

  // Confirm week was NOT incremented again
  const freshState = await GameState.findOne({ user: testUser._id });
  assert.strictEqual(freshState.currentWeek, 6);
});

test("rejects stale tick requests when expectedWeek does not match", async () => {
  let statusCode = null;
  let responseBody = null;

  const req = {
    user: testUser,
    body: { weeks: 1, expectedWeek: 4 }, // GameState is currently on week 5
    headers: {},
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
  };

  await simulateWeek(req, res);

  assert.strictEqual(statusCode, 409);
  assert.strictEqual(responseBody?.success, false);
  assert.ok(responseBody?.message?.includes("Stale simulation request"));

  // Confirm week remained at 5
  const freshState = await GameState.findOne({ user: testUser._id });
  assert.strictEqual(freshState.currentWeek, 5);
});
