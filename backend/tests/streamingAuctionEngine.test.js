import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculatePlatformBids } from "../src/services/streamingAuctionEngine.js";

describe("Streaming Auction Engine Unit Tests", () => {
  it("calculatePlatformBids generates valid array of platform bids sorted by highest amount", () => {
    const movie = {
      title: "Cyberpunk Action 2077",
      rating: 88,
      budget: 80000000,
      boxOfficeTotal: 250000000,
    };

    const bids = calculatePlatformBids(movie, "EXCLUSIVE_DAY_DATE", 500000);

    assert.strictEqual(bids.length, 4, "Should generate bids for 4 platforms");
    assert.ok(bids[0].amount >= bids[1].amount, "Bids array should be sorted descending");
    assert.ok(bids[0].amount >= 500000, "Winning bid should meet asking price");
  });

  it("calculatePlatformBids enforces asking price baseline", () => {
    const movie = { title: "Indie Drama", rating: 40, budget: 500000 };
    const bids = calculatePlatformBids(movie, "POST_THEATRICAL_SVOD", 1000000);

    assert.ok(bids.every((b) => b.amount >= 1000000), "All bids must satisfy asking price baseline");
  });
});
