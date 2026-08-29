import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSubscriberAcquisition,
  calculateSubscriberChurn,
  calculatePlatformFinancials,
  calculateRecommendationUpgradeCost,
  simulatePlatformWeeklyTick,
} from "../src/services/simulation/engines/streamingPlatformEngine.js";

describe("Streaming Platform Economy & Subscriber Simulation Tests", () => {
  it("calculates subscriber acquisition factoring catalog depth, quality, and pricing", () => {
    const strongPlatform = {
      monthlySubscriptionPrice: 9.99,
      strategy: "BLOCKBUSTER_FOCUSED",
      prestigeRating: 80,
      subscribers: 1000000,
      catalog: [
        { title: "Hit 1", qualityScore: 90, isExclusive: true },
        { title: "Hit 2", qualityScore: 85, isExclusive: true },
        { title: "Hit 3", qualityScore: 80, isExclusive: false },
      ],
    };

    const weakPlatform = {
      monthlySubscriptionPrice: 24.99, // Overpriced
      strategy: "BALANCED",
      prestigeRating: 40,
      subscribers: 1000000,
      catalog: [],
    };

    const acqStrong = calculateSubscriberAcquisition(strongPlatform);
    const acqWeak = calculateSubscriberAcquisition(weakPlatform);

    assert.ok(acqStrong > acqWeak, "Platform with strong content and fair price should acquire faster");
    assert.ok(acqStrong >= 10000);
  });

  it("calculates subscriber churn and verifies recommendation engine retention discount", () => {
    const basePlatform = {
      monthlySubscriptionPrice: 9.99,
      subscribers: 2000000,
      recommendationTechLevel: 1,
      catalog: Array(5).fill({ isExclusive: false }),
    };

    const upgradedPlatform = {
      ...basePlatform,
      recommendationTechLevel: 8, // High tech level
      catalog: Array(25).fill({ isExclusive: true }),
    };

    const churnBase = calculateSubscriberChurn(basePlatform);
    const churnUpgraded = calculateSubscriberChurn(upgradedPlatform);

    assert.ok(
      churnUpgraded.churnRatePercent < churnBase.churnRatePercent,
      "Upgraded recommendation engine and deep catalog must reduce churn rate"
    );
    assert.ok(churnUpgraded.subscribersLost < churnBase.subscribersLost);
  });

  it("calculates platform economics and net weekly P&L correctly", () => {
    const platform = {
      subscribers: 2000000,
      monthlySubscriptionPrice: 10.0,
      serverBandwidthTier: 2,
      catalog: [
        { weeklyLicensingCost: 50000 },
        { weeklyLicensingCost: 75000 },
      ],
    };

    const fin = calculatePlatformFinancials(platform);
    assert.ok(fin.weeklyGrossRevenue > 4000000, "Gross revenue should reflect ~2M subs * $10 / 4.33 weeks");
    assert.ok(fin.weeklyServerCost > 0);
    assert.strictEqual(fin.weeklyContentCost, 125000);
    assert.strictEqual(fin.weeklyNetProfit, fin.weeklyGrossRevenue - fin.weeklyServerCost - fin.weeklyContentCost);
  });

  it("calculates recommendation tech upgrade costs with scaling curves", () => {
    const costLevel1 = calculateRecommendationUpgradeCost(1);
    const costLevel5 = calculateRecommendationUpgradeCost(5);
    const costLevel10 = calculateRecommendationUpgradeCost(10);

    assert.ok(costLevel1 > 0);
    assert.ok(costLevel5 > costLevel1);
    assert.strictEqual(costLevel10, 0, "Max tier 10 should cost 0");
  });

  it("simulates full weekly platform tick and updates historical subscriber trends", () => {
    const initialPlatform = {
      subscribers: 1500000,
      monthlySubscriptionPrice: 11.99,
      strategy: "PRESTIGE_FIRST",
      prestigeRating: 75,
      recommendationTechLevel: 3,
      serverBandwidthTier: 2,
      catalog: [{ qualityScore: 85, weeklyLicensingCost: 30000 }],
      historicalSubscribers: [],
    };

    const updated = simulatePlatformWeeklyTick(initialPlatform, 4);

    assert.ok(updated.subscribers > 0);
    assert.ok(updated.weeklySubscriberGrowth > 0);
    assert.ok(updated.weeklySubscriberChurn > 0);
    assert.strictEqual(updated.historicalSubscribers.length, 1);
    assert.strictEqual(updated.historicalSubscribers[0].week, 4);
    assert.strictEqual(updated.historicalSubscribers[0].subscribers, updated.subscribers);
  });
});
