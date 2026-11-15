import "./helpers/testEnv.js";
import test, { before, after } from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import env from "../src/config/envConfig.js";
import User from "../src/models/User.js";

let server;
let baseUrl;
let regularUserToken;
let adminUserToken;
let operationsUserToken;

before(async () => {
  const { default: app } = await import("../src/app.js");

  // Create mock users in memory / db mock
  const regularUserId = new mongoose.Types.ObjectId();
  const adminUserId = new mongoose.Types.ObjectId();
  const opsUserId = new mongoose.Types.ObjectId();

  // Create JWT tokens
  regularUserToken = jwt.sign({ userId: regularUserId }, env.JWT_ACCESS_SECRET);
  adminUserToken = jwt.sign({ userId: adminUserId }, env.JWT_ACCESS_SECRET);
  operationsUserToken = jwt.sign({ userId: opsUserId }, env.JWT_ACCESS_SECRET);

  // Stub User.findById for authentication middleware
  const originalFindById = User.findById;
  User.findById = (id) => {
    const idStr = id?.toString();
    let role = "player";
    if (idStr === adminUserId.toString()) role = "admin";
    else if (idStr === opsUserId.toString()) role = "operations";

    return {
      select: () =>
        Promise.resolve({
          _id: id,
          username: `user-${role}`,
          role,
          isDisabled: false,
        }),
    };
  };

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test("GET /api/observability/metrics rejects unauthenticated access with 401", async () => {
  const res = await fetch(`${baseUrl}/api/observability/metrics`);
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.code, "ACCESS_TOKEN_MISSING");
});

test("GET /api/observability/metrics rejects standard player without admin/operations role with 403", async () => {
  const res = await fetch(`${baseUrl}/api/observability/metrics`, {
    headers: {
      Authorization: `Bearer ${regularUserToken}`,
    },
  });
  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.strictEqual(data.code, "FORBIDDEN");
});

test("GET /api/observability/metrics permits admin user and returns sanitized metrics schema", async () => {
  const res = await fetch(`${baseUrl}/api/observability/metrics`, {
    headers: {
      Authorization: `Bearer ${adminUserToken}`,
    },
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.service.status, "healthy");
  assert.strictEqual(typeof data.service.uptimeSeconds, "number");
  assert.strictEqual(typeof data.memory.heapUsedMB, "number");
  assert.strictEqual(typeof data.memory.heapTotalMB, "number");
  assert.strictEqual(typeof data.memory.rssMB, "number");
  assert.strictEqual(typeof data.database.connected, "boolean");

  // Ensure internal infrastructure details (pid, node version, paths) are NOT leaked
  assert.strictEqual(data.process, undefined);
  assert.strictEqual(data.pid, undefined);
  assert.strictEqual(data.nodeVersion, undefined);
});

test("GET /api/observability/metrics permits operations user", async () => {
  const res = await fetch(`${baseUrl}/api/observability/metrics`, {
    headers: {
      Authorization: `Bearer ${operationsUserToken}`,
    },
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
});
