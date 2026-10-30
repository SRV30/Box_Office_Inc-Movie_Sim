import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import User from "../src/models/User.js";
import Studio from "../src/models/Studio.js";
import GameState from "../src/models/GameState.js";
import env from "../src/config/envConfig.js";

let mongod;
let server;
let baseUrl;
let authToken;
let userId;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());

  const user = await User.create({
    username: "director_trainee",
    email: "director_trainee@cineverse.com",
    password: "Password123!",
  });

  userId = user._id;

  const studio = await Studio.create({
    owner: user._id,
    name: "Miracle Studios",
    money: 10000000,
  });

  await GameState.create({
    user: user._id,
    studioName: "Miracle Studios",
  });

  authToken = jwt.sign(
    { userId: user._id, studioId: studio._id },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );

  const { default: app } = await import("../src/app.js");
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("GET /api/tutorial/state retrieves initial onboarding state with 8 steps", async () => {
  const res = await fetch(`${baseUrl}/api/tutorial/state`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.data.currentStep, 0);
  assert.strictEqual(body.data.currentStepId, "WELCOME_STUDIO");
  assert.ok(body.data.allSteps.length >= 8);
  assert.strictEqual(body.data.isCompleted, false);
});

test("POST /api/tutorial/advance progresses the player through milestones", async () => {
  const res = await fetch(`${baseUrl}/api/tutorial/advance`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stepId: "WELCOME_STUDIO",
      nextStepIndex: 1,
    }),
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.data.currentStep, 1);
  assert.strictEqual(body.data.currentStepId, "SCOUT_SCRIPT");
  assert.ok(body.data.completedSteps.includes("WELCOME_STUDIO"));
});

test("POST /api/tutorial/skip marks tutorial as skipped", async () => {
  const res = await fetch(`${baseUrl}/api/tutorial/skip`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.data.isSkipped, true);
});

test("POST /api/tutorial/replay resets onboarding and increments replay count", async () => {
  const res = await fetch(`${baseUrl}/api/tutorial/replay`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.data.currentStep, 0);
  assert.strictEqual(body.data.isSkipped, false);
  assert.ok(body.data.replayCount >= 1);
});
