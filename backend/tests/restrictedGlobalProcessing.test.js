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

before(async () => {
  const { default: app } = await import("../src/app.js");

  const regularUserId = new mongoose.Types.ObjectId();
  regularUserToken = jwt.sign({ userId: regularUserId }, env.JWT_ACCESS_SECRET);

  User.findById = (id) => ({
    select: () =>
      Promise.resolve({
        _id: id,
        username: "testplayer",
        role: "player",
        isDisabled: false,
      }),
  });

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

test("POST /api/bond-market/process-weekly rejects regular authenticated players with 403 Forbidden", async () => {
  const res = await fetch(`${baseUrl}/api/bond-market/process-weekly`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${regularUserToken}`,
    },
  });
  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.strictEqual(data.code, "FORBIDDEN");
});

test("POST /api/merchandise/process-weekly rejects regular authenticated players with 403 Forbidden", async () => {
  const res = await fetch(`${baseUrl}/api/merchandise/process-weekly`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${regularUserToken}`,
    },
  });
  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.strictEqual(data.code, "FORBIDDEN");
});
