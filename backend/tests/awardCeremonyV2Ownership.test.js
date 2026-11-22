import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { getCeremonyHistory } from "../src/controllers/awardCeremonyV2Controller.js";
import GameState from "../src/models/GameState.js";

test("Award Ceremony V2 history rejects cross-user gameStateId queries with 403", async () => {
  const userAId = new mongoose.Types.ObjectId();
  const gameStateAId = new mongoose.Types.ObjectId();
  const foreignGameStateId = new mongoose.Types.ObjectId();

  const origFindOne = GameState.findOne;
  GameState.findOne = async () => ({
    _id: gameStateAId,
    user: userAId,
  });

  const req = {
    user: { _id: userAId },
    params: { gameStateId: foreignGameStateId.toString() },
  };

  let statusCode = 200;
  let responseBody = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return { json: (data) => { responseBody = data; } };
    },
  };

  await getCeremonyHistory(req, res);
  assert.strictEqual(statusCode, 403);
  assert.strictEqual(responseBody.message, "Unauthorized game state access");

  GameState.findOne = origFindOne;
});
