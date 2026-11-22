import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { startAwardsCampaign } from "../src/controllers/awardsCampaignController.js";
import Movie from "../src/models/Movie.js";
import Studio from "../src/models/Studio.js";

test("startAwardsCampaign enforces studio ownership and rejects cross-studio movie IDs with 404", async () => {
  const userAId = new mongoose.Types.ObjectId();
  const studioAId = new mongoose.Types.ObjectId();
  const studioBId = new mongoose.Types.ObjectId();

  const originalStudioFindOne = Studio.findOne;
  const originalMovieFindOne = Movie.findOne;

  Studio.findOne = async () => ({
    _id: studioAId,
    owner: userAId,
    money: 1000000,
    prestige: 10,
  });

  // Movie belongs to studioBId, not studioAId
  Movie.findOne = async (query) => {
    if (query.studioId?.toString() === studioAId.toString()) {
      return null;
    }
    return {
      _id: query._id,
      studioId: studioBId,
      title: "Rival Film",
      status: "RELEASED",
      awards: [],
    };
  };

  const req = {
    user: { _id: userAId },
    body: {
      movieId: new mongoose.Types.ObjectId().toString(),
      categoryId: "Best Picture",
    },
  };

  let statusCode = 200;
  let responseBody = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseBody = data;
        },
      };
    },
  };

  await startAwardsCampaign(req, res);

  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseBody.success, false);
  assert.strictEqual(responseBody.message, "Movie not found");

  Studio.findOne = originalStudioFindOne;
  Movie.findOne = originalMovieFindOne;
});
