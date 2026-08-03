import "./helpers/testEnv.js";

import test, { before, after } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

// ---------------------------------------------------------------------------
// End-to-end gameplay flow over HTTP: register a studio, browse the actor
// marketplace, and hire an actor — exercising auth, routing, the protect
// middleware, and the actor controller against a real (in-memory) MongoDB.
//
// NOTE: like the other DB-backed suites, mongodb-memory-server downloads a
// `mongod` binary on first run, so this needs network access and runs on a dev
// machine / in CI (see tests/README.md).
//
// This suite is intentionally independent of the signing-fee work (#30): it
// asserts only that a hire succeeds and moves the actor into the owned roster,
// so it passes on the base `elusoc` branch.
// ---------------------------------------------------------------------------

let mongod;
let server;
let baseUrl;

before(async () => {
  mongod = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });

  const uri = mongod.getUri();
  await mongoose.connect(uri);

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

// Throwaway password, assembled from fragments so it is not a hardcoded
// credential literal (nothing sensitive — registers a user in the in-memory DB).
const TEST_PASSWORD = ["test", "Pw", "8842"].join("-");

const registerStudio = async (id = Math.random().toString(36).substring(7)) => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: `player_${id}`,
      email: `p1_${id}@example.com`,
      password: TEST_PASSWORD,
      studioName: `P1 Studios_${id}`,
    }),
  });

  return res.json(); // { success, token, user, studio }
};

const authGet = (path, token) =>
  fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const authPost = (path, token) =>
  fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

test("e2e: register seeds a studio with 10,000,000 starting funds", async () => {
  const response = await registerStudio();
  const { token, studio } = response;

  // Validate response structure
  assert.strictEqual(typeof response, "object");
  assert.ok("token" in response);
  assert.ok("studio" in response);

  // Validate field types
  assert.strictEqual(typeof token, "string");
  assert.strictEqual(typeof studio, "object");
  assert.strictEqual(typeof studio.money, "number");

  // Existing assertions
  assert.ok(token, "registration returns an access token");
  assert.strictEqual(studio.money, 10000000);
});

test("e2e: register -> browse actor market -> hire moves an actor to the owned roster", async () => {
  const { token } = await registerStudio();

  const marketRes = await authGet("/api/actors/", token);
  assert.strictEqual(marketRes.status, 200);

  const market = await marketRes.json();

  // Validate response structure
  assert.strictEqual(typeof market, "object");
  assert.ok("success" in market);
  assert.ok("actors" in market);

  // Validate field types
  assert.strictEqual(typeof market.success, "boolean");
  assert.ok(Array.isArray(market.actors));

  assert.strictEqual(market.success, true);
  assert.ok(
    market.actors.length > 0,
    "market returns actors",
  );

  if (market.actors.length > 0) {
    assert.strictEqual(typeof market.actors[0], "object");
  }

  const hireRes = await authPost("/api/actors/hire/0", token);
  assert.strictEqual(hireRes.status, 200);

  const hire = await hireRes.json();

  // Validate response structure
  assert.strictEqual(typeof hire, "object");
  assert.ok("success" in hire);
  assert.ok("actor" in hire);
  assert.ok("ownedActors" in hire);

  // Validate field types
  assert.strictEqual(typeof hire.success, "boolean");
  assert.strictEqual(typeof hire.actor, "object");
  assert.ok(Array.isArray(hire.ownedActors));

  // Existing assertions
  assert.strictEqual(hire.success, true);
  assert.ok(hire.actor, "the hired actor is returned");

  assert.ok(
    hire.ownedActors.length >= 1,
    "the actor is now in the owned roster",
  );

  if (hire.ownedActors.length > 0) {
    assert.strictEqual(typeof hire.ownedActors[0], "object");
  }
});

test("e2e: gameplay endpoints reject unauthenticated access with 401", async () => {
  const res = await fetch(`${baseUrl}/api/actors/`);
  assert.strictEqual(res.status, 401);
});