import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateContractOffer,
  calculateBackendRoyalty,
  calculateBuyoutPenalty,
  calculateContractBreachPenalty,
  evaluateContractRenegotiation,
} from "../src/services/simulation/engines/contractEngine.js";
import { validateContractNegotiationSchema, validateContractRenegotiationSchema } from "../src/validators/contractValidators.js";

describe("Contract Engine Unit Tests", () => {
  test("evaluateContractOffer accepts generous offer for popular talent", () => {
    const offer = { upfrontFee: 3000000, backendRoyaltyPercentage: 10 };
    const result = evaluateContractOffer(offer, 80);
    assert.equal(result.accepted, true);
  });

  test("calculateBackendRoyalty calculates correct percentage payout", () => {
    const payout = calculateBackendRoyalty(100000000, 5);
    assert.equal(payout, 5000000);
  });

  test("calculateBuyoutPenalty scales penalty based on remaining weeks", () => {
    const penaltyShort = calculateBuyoutPenalty(1000000, 2);
    const penaltyLong = calculateBuyoutPenalty(1000000, 10);
    assert.ok(penaltyLong > penaltyShort);
  });

  test("calculateContractBreachPenalty applies popularity multiplier", () => {
    const penalty = calculateContractBreachPenalty(1000000, 50);
    assert.equal(penalty, 2000000);
  });

  test("evaluateContractRenegotiation approves sufficient salary increase", () => {
    const current = { offer: { baseSalary: 100000, backendPoints: 5 } };
    const newOffer = { baseSalary: 150000, backendPoints: 10 };
    const result = evaluateContractRenegotiation(current, newOffer);
    assert.equal(result.approved, true);
  });

  test("validateContractNegotiationSchema validates correctly", () => {
    const parsed = validateContractNegotiationSchema.body.parse({
      talentId: "talent_123",
      talentType: "ACTOR",
      offer: { baseSalary: 500000, backendPoints: 10, movieCount: 3 },
    });
    assert.equal(parsed.talentType, "ACTOR");
    assert.equal(parsed.offer.movieCount, 3);
  });
});
