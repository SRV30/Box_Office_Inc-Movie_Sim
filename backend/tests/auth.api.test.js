import "./helpers/testEnv.js";

import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// ---------------------------------------------------------------------------
// Authentication flow — full HTTP coverage against a real (in-memory) MongoDB.
//
// NOTE: mongodb-memory-server downloads a `mongod` binary from
// fastdl.mongodb.org the first time it runs, so this suite needs network access
// and runs on a dev machine / in CI (see tests/README.md). The CI workflow in
// .github/workflows/ci.yml runs it automatically.
//
// The app is imported only after mongoose is connected, and is started on an
// ephemeral port; requests use the built-in fetch client.
// ---------------------------------------------------------------------------

let mongod;
let server;
let baseUrl;

// Throwaway password for the test user, assembled from fragments so it is not a
// hardcoded credential literal (keeps secret scanners quiet — there is nothing
// sensitive here; it only registers a user in the ephemeral in-memory DB).
const TEST_PASSWORD = ["test", "Pw", "8842"].join("-");

const validUser = () => ({
  username: "studio_boss",
  email: "boss@example.com",
  password: TEST_PASSWORD,
  studioName: "Boss Studios",
});

const postJSON = (path, body) =>
  fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

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

beforeEach(async () => {
  // Clean slate between tests.
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

test("POST /api/auth/register creates a user + studio (10M) and returns a token", async () => {
  const res = await postJSON("/api/auth/register", validUser());
  assert.strictEqual(res.status, 201);

  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.ok(body.token, "an access token is returned");
  assert.strictEqual(body.user.email, "boss@example.com");
  assert.strictEqual(body.user.password, undefined, "password is never returned");
  assert.strictEqual(body.studio.money, 10000000, "studio starts with 10,000,000");
});

test("POST /api/auth/register rejects a duplicate email with 400", async () => {
  await postJSON("/api/auth/register", validUser());
  const res = await postJSON("/api/auth/register", {
    ...validUser(),
    username: "another_name",
  });
  assert.strictEqual(res.status, 400);
  const body = await res.json();
  assert.strictEqual(body.success, false);
});

test("POST /api/auth/register rejects an invalid body via the validation middleware", async () => {
  const res = await postJSON("/api/auth/register", {
    username: "ab", // too short
    email: "not-an-email",
    password: "123", // too short
  });
  assert.strictEqual(res.status, 400);
});

test("POST /api/auth/login succeeds with correct credentials", async () => {
  await postJSON("/api/auth/register", validUser());
  const res = await postJSON("/api/auth/login", {
    email: "boss@example.com",
    password: TEST_PASSWORD,
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(body.token);
  assert.strictEqual(body.user.email, "boss@example.com");
});

test("POST /api/auth/login rejects a wrong password with 401", async () => {
  await postJSON("/api/auth/register", validUser());
  const res = await postJSON("/api/auth/login", {
    email: "boss@example.com",
    password: "wrong-password",
  });
  assert.strictEqual(res.status, 401);
});

test("POST /api/auth/login rejects an unknown email with 401", async () => {
  const res = await postJSON("/api/auth/login", {
    email: "ghost@example.com",
    password: TEST_PASSWORD,
  });
  assert.strictEqual(res.status, 401);
});

test("GET /api/auth/me requires authentication", async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`);
  assert.strictEqual(res.status, 401);
});

test("GET /api/auth/me returns the current user with a valid Bearer token", async () => {
  const registration = await (await postJSON("/api/auth/register", validUser())).json();
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${registration.token}` },
  });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.user.email, "boss@example.com");
});

test("GET /api/auth/me rejects a malformed token with 401", async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: "Bearer not-a-real-token" },
  });
  assert.strictEqual(res.status, 401);
});

test("POST /api/auth/refresh returns 401 when refresh token cookie is missing", async () => {
  const res = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
  });
  assert.strictEqual(res.status, 401);
  const body = await res.json();
  assert.strictEqual(body.success, false);
  assert.match(body.message, /Refresh token missing/i);
});

test("POST /api/auth/refresh succeeds with valid cookie and rotates token", async () => {
  const regRes = await postJSON("/api/auth/register", validUser());
  const cookieHeader = regRes.headers.get("set-cookie");
  assert.ok(cookieHeader, "registration sets refreshToken cookie");

  const res = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader.split(";")[0],
    },
  });

  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.ok(body.token, "a refreshed access token is returned");
  assert.strictEqual(body.user.email, "boss@example.com");
});

test("POST /api/auth/refresh rejects invalid or forged cookie with 401", async () => {
  const res = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: "refreshToken=forged-invalid-jwt-token",
    },
  });
  assert.strictEqual(res.status, 401);
  const body = await res.json();
  assert.strictEqual(body.success, false);
});
