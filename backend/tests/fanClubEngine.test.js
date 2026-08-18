import test from "node:test";
import assert from "node:assert";
import { processFanClubTick } from "../src/services/simulation/engines/fanClubEngine.js";

test("fanClubEngine: initializes fanClub if not present", () => {
  const gameState = { currentWeek: 1, notifications: [] };
  const studio = { money: 1000000, fans: 0 };

  processFanClubTick(gameState, studio);

  assert.ok(studio.fanClub);
  assert.strictEqual(studio.fanClub.weeklyBudget, 0);
  assert.strictEqual(studio.fanClub.totalFans, 0);
  assert.strictEqual(studio.fanClub.lastConventionWeek, null);
});

test("fanClubEngine: deducts budget and grows fans on sufficient funds", () => {
  const gameState = { currentWeek: 1, notifications: [] };
  const studio = {
    money: 100000,
    fans: 1000,
    fanClub: {
      weeklyBudget: 10000,
      totalFans: 500,
      lastConventionWeek: null,
    },
  };

  processFanClubTick(gameState, studio);

  // Deducted budget: 100000 - 10000 = 90000
  assert.strictEqual(studio.money, 90000);
  // Fans grew: 10000 / 100 = 100 base growth. With variance, should be > 0.
  assert.ok(studio.fanClub.totalFans > 500);
  assert.ok(studio.fans > 1000);
});

test("fanClubEngine: skips budget and growth on insufficient funds", () => {
  const gameState = { currentWeek: 1, notifications: [] };
  const studio = {
    money: 5000,
    fans: 1000,
    fanClub: {
      weeklyBudget: 10000,
      totalFans: 500,
      lastConventionWeek: null,
    },
  };

  processFanClubTick(gameState, studio);

  // No change
  assert.strictEqual(studio.money, 5000);
  assert.strictEqual(studio.fanClub.totalFans, 500);
  assert.strictEqual(studio.fans, 1000);
});

test("fanClubEngine: handles zero budget gracefully", () => {
  const gameState = { currentWeek: 2, notifications: [] };
  const studio = {
    money: 500000,
    fans: 200,
    fanClub: { weeklyBudget: 0, totalFans: 200, lastConventionWeek: 1 },
  };

  processFanClubTick(gameState, studio);
  assert.strictEqual(studio.money, 500000);
  assert.strictEqual(studio.fanClub.totalFans, 200);
});
