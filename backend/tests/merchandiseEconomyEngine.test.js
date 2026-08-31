import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORY_CONFIGS,
  calculateSeasonalMultiplier,
  calculateWeeklyMerchandiseDemand,
  simulateWeeklyProductSales,
  calculateLiquidationValue,
  calculateRestockBatchCost,
} from "../src/services/simulation/engines/merchandiseEconomyEngine.js";

describe("Merchandise Economy, Demand, and Inventory Simulation Tests", () => {
  it("verifies all product categories have distinct baseline manufacturing costs and retail anchors", () => {
    const categories = [
      "ACTION_FIGURES_TOYS",
      "APPAREL_CLOTHING",
      "BOOKS_NOVELIZATIONS",
      "LIMITED_COLLECTIBLES",
      "DIGITAL_COSMETICS",
      "SOUNDTRACKS_VINYL",
    ];

    for (const cat of categories) {
      assert.ok(CATEGORY_CONFIGS[cat], `Category ${cat} must exist`);
      assert.ok(CATEGORY_CONFIGS[cat].baseCost > 0);
      assert.ok(CATEGORY_CONFIGS[cat].suggestedRetail > CATEGORY_CONFIGS[cat].baseCost);
    }
  });

  it("calculates seasonal demand multipliers across summer, holiday Q4, and back-to-school peaks", () => {
    const summerInPeak = calculateSeasonalMultiplier("SUMMER_BLOCKBUSTER", 25);
    const summerOffPeak = calculateSeasonalMultiplier("SUMMER_BLOCKBUSTER", 5);
    assert.ok(summerInPeak > summerOffPeak, "Summer blockbuster season must surge in week 25");

    const holidayInPeak = calculateSeasonalMultiplier("HOLIDAY_Q4", 48);
    const holidayOffPeak = calculateSeasonalMultiplier("HOLIDAY_Q4", 15);
    assert.ok(holidayInPeak > holidayOffPeak, "Q4 Holiday season must surge in week 48");
  });

  it("calculates weekly merchandise demand factoring IP popularity and clearance discount markdowns", () => {
    const hitIP = { popularity: 90 };
    const flopIP = { popularity: 20 };

    const standardProduct = {
      category: "ACTION_FIGURES_TOYS",
      retailPrice: 29.99,
      unitManufacturingCost: 8,
      seasonalAffinity: "YEAR_ROUND",
      discountMarkdownPercent: 0,
      qualityRating: 80,
    };

    const discountedProduct = {
      ...standardProduct,
      discountMarkdownPercent: 40, // 40% clearance discount
    };

    const demandHit = calculateWeeklyMerchandiseDemand(standardProduct, hitIP, 10);
    const demandFlop = calculateWeeklyMerchandiseDemand(standardProduct, flopIP, 10);
    const demandDiscounted = calculateWeeklyMerchandiseDemand(discountedProduct, hitIP, 10);

    assert.ok(demandHit > demandFlop, "Hit IP must drive substantially higher merchandise demand");
    assert.ok(demandDiscounted > demandHit, "Discount markdown must accelerate inventory velocity");
  });

  it("simulates weekly sell-through, deducts warehouse storage fees, and computes net profit", () => {
    const product = {
      category: "APPAREL_CLOTHING",
      inventoryStock: 5000,
      retailPrice: 25.0,
      discountMarkdownPercent: 0,
      unitManufacturingCost: 6,
      seasonalAffinity: "YEAR_ROUND",
      qualityRating: 75,
      status: "ACTIVE",
    };

    const result = simulateWeeklyProductSales(product, { popularity: 75 }, 12);

    assert.ok(result.unitsSold > 0);
    assert.ok(result.weeklyGrossRevenue > 0);
    assert.ok(result.weeklyStorageFee >= 0);
    assert.strictEqual(result.weeklyNetProfit, result.weeklyGrossRevenue - result.weeklyStorageFee);
    assert.strictEqual(result.updatedProduct.inventoryStock, 5000 - result.unitsSold);
  });

  it("calculates liquidation cash recovery and bulk restock batch discounts", () => {
    const productToLiquidate = {
      inventoryStock: 2000,
      unitManufacturingCost: 10,
    };

    const liquidation = calculateLiquidationValue(productToLiquidate);
    assert.strictEqual(liquidation.unitsLiquidated, 2000);
    assert.strictEqual(liquidation.payout, 2000 * 10 * 0.35); // 35% recovery

    const smallBatchCost = calculateRestockBatchCost(10, 1000);
    const bulkBatchCost = calculateRestockBatchCost(10, 50000);

    assert.strictEqual(smallBatchCost, 10000);
    assert.strictEqual(bulkBatchCost, 50000 * 10 * 0.8); // 20% bulk discount
  });
});
