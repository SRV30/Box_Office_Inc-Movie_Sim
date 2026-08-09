import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCreditRatingAndYield } from "../src/services/bondMarketEngine.js";

describe("Studio Bond Market Engine Unit Tests", () => {
  it("calculateCreditRatingAndYield assigns AAA rating and low interest yield to high equity studio", () => {
    const balance = 100000000;
    const totalDebt = 10000000;
    const prestige = 90;

    const evalResult = calculateCreditRatingAndYield(balance, totalDebt, prestige);

    assert.strictEqual(evalResult.creditRating, "AAA");
    assert.strictEqual(evalResult.interestRatePercent, 3.5);
  });

  it("calculateCreditRatingAndYield assigns CCC rating and high yield to insolvent studio", () => {
    const balance = 1000000;
    const totalDebt = 10000000;
    const prestige = 40;

    const evalResult = calculateCreditRatingAndYield(balance, totalDebt, prestige);

    assert.strictEqual(evalResult.creditRating, "CCC");
    assert.strictEqual(evalResult.interestRatePercent, 18.5);
  });
});
