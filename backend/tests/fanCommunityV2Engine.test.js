import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateFanImpactMultiplier } from "../src/services/simulation/engines/fanCommunityV2Engine.js";

describe("Fan Community V2 Engine Unit Tests", () => {
  it("calculates fan impact multiplier based on sentiment score", () => {
    const highSentiment = { sentimentScore: 90, reviewBombingState: { isReviewBombing: false } };
    const lowSentiment = { sentimentScore: 20, reviewBombingState: { isReviewBombing: false } };

    const multHigh = calculateFanImpactMultiplier(highSentiment);
    const multLow = calculateFanImpactMultiplier(lowSentiment);

    assert.ok(multHigh > 1.0);
    assert.ok(multLow < 1.0);
  });

  it("reduces box office multiplier significantly during hate review-bombing campaign", () => {
    const hateCampaign = {
      sentimentScore: 20,
      reviewBombingState: {
        isReviewBombing: true,
        campaignType: "HATE_CAMPAIGN",
      },
    };

    const multiplier = calculateFanImpactMultiplier(hateCampaign);
    assert.ok(multiplier <= 0.65);
  });
});
