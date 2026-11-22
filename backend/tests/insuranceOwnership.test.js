import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { purchasePolicy } from "../src/controllers/insuranceController.js";
import Studio from "../src/models/Studio.js";
import Movie from "../src/models/Movie.js";

test("purchasePolicy rejects unowned movie IDs with 404 and does not create policy", async () => {
  const userAId = new mongoose.Types.ObjectId();
  const studioAId = new mongoose.Types.ObjectId();
  const foreignMovieId = new mongoose.Types.ObjectId();

  const origStudioFindOne = Studio.findOne;
  const origMovieFindOne = Movie.findOne;

  Studio.findOne = async () => ({ _id: studioAId, owner: userAId });
  Movie.findOne = async (query) => {
    if (query.studioId?.toString() === studioAId.toString()) {
      return null;
    }
    return { _id: foreignMovieId, title: "Competitor Film" };
  };

  const req = {
    user: { _id: userAId },
    body: { movieId: foreignMovieId.toString(), policyType: "PRODUCTION_HALT" },
  };

  let statusCode = 200;
  let responseBody = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return { json: (data) => { responseBody = data; } };
    },
  };

  await purchasePolicy(req, res, () => {});
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseBody.message, "Movie not found");

  Studio.findOne = origStudioFindOne;
  Movie.findOne = origMovieFindOne;
});
