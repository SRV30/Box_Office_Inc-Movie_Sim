import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { createMovie } from "../src/controllers/movieController.js";
import Studio from "../src/models/Studio.js";
import GameState from "../src/models/GameState.js";

test("createMovie validates soundtrack tier and funds BEFORE any mutation occurs", async () => {
  const userId = new mongoose.Types.ObjectId();
  const originalStudioFindOne = Studio.findOne;
  const originalGameStateFindOne = GameState.findOne;

  Studio.findOne = async () => ({
    _id: new mongoose.Types.ObjectId(),
    owner: userId,
    money: 50000, // Insufficient for 100,000 marketing
  });

  GameState.findOne = async () => ({
    _id: new mongoose.Types.ObjectId(),
    user: userId,
    currentWeek: 1,
    ownedScripts: [
      { id: "scr-1", quality: 80, price: 10000, genres: ["Action"], status: "AVAILABLE" },
    ],
    ownedDirectors: [
      { id: "dir-1", creativity: 80, salary: 5000, status: "AVAILABLE" },
    ],
    ownedActors: [
      { id: "act-1", actingSkill: 80, popularity: 80, salary: 5000, status: "AVAILABLE" },
    ],
    ownedCrewTeams: [
      { id: "crew-1", technicalQuality: 80, salary: 5000, status: "AVAILABLE" },
    ],
    activeMovies: [],
  });

  const req = {
    user: { _id: userId },
    body: {
      title: "Blockbuster",
      scriptId: "scr-1",
      directorId: "dir-1",
      leadActorId: "act-1",
      crewTeamId: "crew-1",
      marketingCampaignIds: ["trailer"], // 100,000 cost
      soundtrackTier: "INVALID_TIER",
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

  await createMovie(req, res);

  assert.strictEqual(statusCode, 400);
  assert.strictEqual(responseBody.success, false);
  assert.strictEqual(responseBody.message, "Invalid soundtrack tier");

  Studio.findOne = originalStudioFindOne;
  GameState.findOne = originalGameStateFindOne;
});
