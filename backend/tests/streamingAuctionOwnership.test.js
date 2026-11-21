import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { executeAuctionBidding, submitCounteroffer } from "../src/controllers/streamingAuctionController.js";
import Studio from "../src/models/Studio.js";
import StreamingAuction from "../src/models/StreamingAuction.js";

test("streaming auction endpoints enforce studio ownership and return 404 for unowned auctions", async () => {
  const userAId = new mongoose.Types.ObjectId();
  const studioAId = new mongoose.Types.ObjectId();
  const auctionId = new mongoose.Types.ObjectId();

  const originalStudioFindOne = Studio.findOne;
  const originalAuctionFindOne = StreamingAuction.findOne;

  Studio.findOne = async () => ({ _id: studioAId, owner: userAId });
  StreamingAuction.findOne = async (query) => {
    if (query.studioId?.toString() === studioAId.toString()) {
      return null;
    }
    return { _id: auctionId, studioId: new mongoose.Types.ObjectId() };
  };

  const req = {
    user: { _id: userAId },
    params: { auctionId: auctionId.toString() },
    body: { amount: 500000, platformId: "netflix" },
  };

  let statusCode = 200;
  let responseBody = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return { json: (data) => { responseBody = data; } };
    },
  };

  await executeAuctionBidding(req, res);
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseBody.message, "Auction not found");

  await submitCounteroffer(req, res);
  assert.strictEqual(statusCode, 404);
  assert.strictEqual(responseBody.message, "Auction not found");

  Studio.findOne = originalStudioFindOne;
  StreamingAuction.findOne = originalAuctionFindOne;
});
