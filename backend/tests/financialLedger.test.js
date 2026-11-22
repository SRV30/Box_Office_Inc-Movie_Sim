import { describe, it } from "node:test";
import assert from "node:assert/strict";
import FinancialLedgerEntry, {
  FINANCIAL_CATEGORIES,
  FINANCIAL_DIRECTIONS,
} from "../src/models/FinancialLedgerEntry.js";

describe("Financial Ledger Model & Constants Unit Tests", () => {
  it("exports supported financial categories and directions", () => {
    assert.ok(FINANCIAL_CATEGORIES.includes("PRODUCTION"));
    assert.ok(FINANCIAL_CATEGORIES.includes("BOX_OFFICE"));
    assert.ok(FINANCIAL_CATEGORIES.includes("PAYROLL"));
    assert.ok(FINANCIAL_CATEGORIES.includes("STREAMING"));
    assert.ok(FINANCIAL_CATEGORIES.includes("BOND"));
    assert.ok(FINANCIAL_CATEGORIES.includes("MERCHANDISE"));
    assert.ok(FINANCIAL_CATEGORIES.includes("TERRITORY"));
    assert.ok(FINANCIAL_CATEGORIES.includes("INSURANCE"));
    assert.ok(FINANCIAL_CATEGORIES.includes("FESTIVAL"));

    assert.deepStrictEqual(FINANCIAL_DIRECTIONS, ["CREDIT", "DEBIT"]);
  });

  it("validates financial ledger entry schema fields", () => {
    const validEntry = new FinancialLedgerEntry({
      studioId: "507f1f77bcf86cd799439011",
      amount: 450000,
      direction: "DEBIT",
      category: "PRODUCTION",
      description: "Principal filming cost",
      gameWeek: 12,
      runningBalance: 3500000,
    });

    const validationError = validEntry.validateSync();
    assert.strictEqual(validationError, undefined);
    assert.strictEqual(validEntry.amount, 450000);
    assert.strictEqual(validEntry.direction, "DEBIT");
    assert.strictEqual(validEntry.category, "PRODUCTION");
    assert.strictEqual(validEntry.isReversal, false);
  });

  it("rejects invalid financial directions or negative amounts", () => {
    const invalidEntry = new FinancialLedgerEntry({
      studioId: "507f1f77bcf86cd799439011",
      amount: -100,
      direction: "INVALID_DIRECTION",
      category: "PRODUCTION",
      gameWeek: 1,
    });

    const validationError = invalidEntry.validateSync();
    assert.ok(validationError);
    assert.ok(validationError.errors.direction);
    assert.ok(validationError.errors.amount);
  });
});
