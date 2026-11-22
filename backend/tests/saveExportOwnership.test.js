import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { restoreSave } from "../src/controllers/saveExportController.js";

test("restoreSave rejects cross-account backup restoring with 403", async () => {
  const userAId = new mongoose.Types.ObjectId();
  const userBId = new mongoose.Types.ObjectId();

  const req = {
    user: { _id: userAId },
    body: {
      backup: {
        schemaVersion: "1.0.0",
        account: { userId: userBId.toString() },
        data: { studio: {}, gameState: {} },
      },
    },
  };

  let statusCode = 200;
  let responseBody = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return { json: (data) => { responseBody = data; } };
    },
  };

  await restoreSave(req, res, () => {});
  assert.strictEqual(statusCode, 403);
  assert.strictEqual(responseBody.message, "Backup belongs to a different player account and cannot be restored");
});
