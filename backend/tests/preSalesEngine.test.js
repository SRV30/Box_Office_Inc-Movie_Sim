import test from "node:test";
import assert from "node:assert";
import { processPreSalesTick } from "../src/services/simulation/engines/preSalesEngine.js";

test("preSalesEngine: initializes preSalesCampaigns if not present", () => {
  const gameState = { currentWeek: 1 };
  const studio = { money: 1000000 };
  processPreSalesTick(gameState, studio);
  assert.ok(Array.isArray(studio.preSalesCampaigns));
});

test("preSalesEngine: accumulates revenue for active campaigns", () => {
  const gameState = { currentWeek: 5 };
  const studio = {
    money: 1000000,
    preSalesCampaigns: [{
      movieId: "abc123", budget: 500000, preSalesRevenue: 0,
      startWeek: 3, active: true
    }]
  };
  processPreSalesTick(gameState, studio);
  assert.ok(studio.preSalesCampaigns[0].preSalesRevenue > 0);
});

test("preSalesEngine: skips inactive campaigns", () => {
  const gameState = { currentWeek: 5 };
  const studio = {
    money: 1000000,
    preSalesCampaigns: [{
      movieId: "abc123", budget: 500000, preSalesRevenue: 100,
      startWeek: 3, active: false
    }]
  };
  processPreSalesTick(gameState, studio);
  assert.strictEqual(studio.preSalesCampaigns[0].preSalesRevenue, 100);
});
