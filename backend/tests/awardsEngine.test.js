import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCampaignSentiment } from "../src/services/awardsEngine.js";

describe("Academy Awards Engine Unit Tests", () => {
  it("calculateCampaignSentiment generates realistic sentiment scores based on budget and screenings", () => {
    const budget = 500000; // $500k campaign
    const movieRating = 80;
    const screenings = 3;

    const sentiment = calculateCampaignSentiment(budget, movieRating, screenings);

    assert.ok(sentiment >= 50, "Sentiment score should be 50 or higher for good campaign");
    assert.ok(sentiment <= 100, "Sentiment score cannot exceed 100");
  });

  it("calculateCampaignSentiment caps at upper limit of 100", () => {
    const sentiment = calculateCampaignSentiment(10000000, 95, 10);
    assert.strictEqual(sentiment, 100);
  });

  it("calculateCampaignSentiment respects lower limit of 10 for zero-budget weak film", () => {
    const sentiment = calculateCampaignSentiment(0, 10, 0);
    assert.strictEqual(sentiment, 10);
  });
});
