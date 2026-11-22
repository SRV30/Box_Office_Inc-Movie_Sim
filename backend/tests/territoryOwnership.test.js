import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { getTerritoryOffer, signTerritoryDeal } from "../src/controllers/territoryController.js";
import Studio from "../src/models/Studio.js";
import Movie from "../src/models/Movie.js";

test("territory endpoints reject cross-studio movie IDs with 404", async () => {
  const userAId = new mongoose.Types.ObjectId();
  const studioAId = new mongoose.Types.ObjectId();
  const foreignMovieId = new mongoose.Types.ObjectId();

  const origStudioFindOne = Studio.findOne;
  const origMovieFindOne = Movie.findOne;

  Studio.findOne = async () => ({ _id: studioAId, owner: userAId, money: 500000 });
  Movie.findOne = async (query) => {
    if (query.studioId?.toString() === studioAId.toString()) {
      return null;
    }
    return { _id: foreignMovieId, title: "Competitor Movie" };
  };

  const reqOffer = {
    user: { _id: userAId },
    query: { movieId: foreignMovieId.toString(), region: "EUROPE", dealType: "MINIMUM_GUARANTEE" },
  };

  let offerStatus = 200;
  let offerBody = null;
  const resOffer = {
    status: (code) => {
      offerStatus = code;
      return { json: (data) => { offerBody = data; } };
    },
  };

  await getTerritoryOffer(reqOffer, resOffer, () => {});
  assert.strictEqual(offerStatus, 404);
  assert.strictEqual(offerBody.message, "Movie not found");

  const reqSign = {
    user: { _id: userAId },
    body: { movieId: foreignMovieId.toString(), region: "EUROPE", dealType: "MINIMUM_GUARANTEE" },
  };

  let signStatus = 200;
  let signBody = null;
  const resSign = {
    status: (code) => {
      signStatus = code;
      return { json: (data) => { signBody = data; } };
    },
  };

  await signTerritoryDeal(reqSign, resSign, () => {});
  assert.strictEqual(signStatus, 404);
  assert.strictEqual(signBody.message, "Movie not found");

  Studio.findOne = origStudioFindOne;
  Movie.findOne = origMovieFindOne;
});
