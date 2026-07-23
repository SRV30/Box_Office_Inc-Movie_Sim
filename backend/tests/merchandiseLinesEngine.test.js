import test from "node:test";
import assert from "node:assert";
import { processMerchandiseLines, MERCH_LINE_TIERS } from "../src/services/simulation/engines/merchandiseLinesEngine.js";

test("merchandiseLinesEngine: returns 0 if no lines", () => {
  const gameState = { currentWeek: 10 };
  const studio = { money: 1000000, fans: 10000, prestige: 50 };
  const revenue = processMerchandiseLines(gameState, studio);
  assert.strictEqual(revenue, 0);
  assert.strictEqual(studio.money, 1000000);
});

test("merchandiseLinesEngine: generates revenue for active apparel line", () => {
  const gameState = { currentWeek: 10 };
  const studio = {
    money: 1000000,
    fans: 10000,
    prestige: 50,
    merchandiseLines: [{ tier: "APPAREL", active: true, totalRevenue: 0, campaigns: [] }],
    merchandiseIncomeHistory: []
  };
  const revenue = processMerchandiseLines(gameState, studio);
  assert.ok(revenue > 0);
  assert.ok(studio.money > 1000000);
  assert.strictEqual(studio.merchandiseIncomeHistory.length, 1);
});

test("merchandiseLinesEngine: skips inactive lines", () => {
  const gameState = { currentWeek: 10 };
  const studio = {
    money: 1000000,
    fans: 10000,
    prestige: 50,
    merchandiseLines: [{ tier: "APPAREL", active: false, totalRevenue: 0, campaigns: [] }]
  };
  const revenue = processMerchandiseLines(gameState, studio);
  assert.strictEqual(revenue, 0);
  assert.strictEqual(studio.money, 1000000);
});

test("merchandiseLinesEngine: applies campaign boost", () => {
  const gameState = { currentWeek: 10 };
  const studioWithoutCampaign = {
    money: 1000000, fans: 10000, prestige: 50,
    merchandiseLines: [{ tier: "APPAREL", active: true, totalRevenue: 0, campaigns: [] }],
    merchandiseIncomeHistory: []
  };
  const studioWithCampaign = {
    money: 1000000, fans: 10000, prestige: 50,
    merchandiseLines: [{ tier: "APPAREL", active: true, totalRevenue: 0, campaigns: [
      { startWeek: 8, endWeek: 14, boostMultiplier: 0.5, active: true }
    ]}],
    merchandiseIncomeHistory: []
  };
  const revenueWithout = processMerchandiseLines(gameState, studioWithoutCampaign);
  const revenueWith = processMerchandiseLines(gameState, studioWithCampaign);
  assert.ok(revenueWith > revenueWithout, "Campaign should boost revenue");
});

test("merchandiseLinesEngine: expires campaign after endWeek", () => {
  const gameState = { currentWeek: 20 };
  const studio = {
    money: 1000000, fans: 10000, prestige: 50,
    merchandiseLines: [{ tier: "APPAREL", active: true, totalRevenue: 0, campaigns: [
      { startWeek: 8, endWeek: 14, boostMultiplier: 0.5, active: true }
    ]}],
    merchandiseIncomeHistory: []
  };
  processMerchandiseLines(gameState, studio);
  // Campaign should have been expired (week 20 > endWeek 14)
  const campaign = studio.merchandiseLines[0].campaigns[0];
  assert.strictEqual(campaign.active, false);
});
