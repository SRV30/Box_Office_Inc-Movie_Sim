import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { getUniverseById, addCanonEntry, toggleHiatus } from "../src/controllers/franchiseV2Controller.js";
import Studio from "../src/models/Studio.js";
import FranchiseUniverseV2 from "../src/models/FranchiseUniverseV2.js";
import Movie from "../src/models/Movie.js";

test("Franchise Universe V2 endpoints reject cross-studio access with 404", async () => {
  const userAId = new mongoose.Types.ObjectId();
  const studioAId = new mongoose.Types.ObjectId();
  const universeId = new mongoose.Types.ObjectId();
  const foreignMovieId = new mongoose.Types.ObjectId();

  const origStudioFindOne = Studio.findOne;
  const origUniverseFindOne = FranchiseUniverseV2.findOne;
  const origMovieFindOne = Movie.findOne;

  Studio.findOne = async () => ({ _id: studioAId, owner: userAId });

  // FranchiseUniverse belongs to another studio
  FranchiseUniverseV2.findOne = async (query) => {
    if (query.studioId?.toString() === studioAId.toString()) {
      return null;
    }
    return { _id: universeId, studioId: new mongoose.Types.ObjectId() };
  };

  const req = {
    user: { _id: userAId },
    params: { id: universeId.toString() },
    body: { entryId: foreignMovieId.toString(), entryType: "MOVIE" },
  };

  let statusCode = 200;
  let responseBody = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return { json: (data) => { responseBody = data; } };
    },
  };

  await getUniverseById(req, res, () => {});
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseBody.message, "Universe not found");

  await addCanonEntry(req, res, () => {});
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseBody.message, "Universe not found");

  await toggleHiatus(req, res, () => {});
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseBody.message, "Universe not found");

  Studio.findOne = origStudioFindOne;
  FranchiseUniverseV2.findOne = origUniverseFindOne;
  Movie.findOne = origMovieFindOne;
});
