import { describe, it } from "node:test";
import assert from "node:assert";
import {
  normalizePair,
  calculateRelationshipModifiers,
  evaluateCastChemistry,
} from "../src/services/simulation/engines/relationshipEngine.js";
import { RELATIONSHIP_TYPES } from "../src/models/TalentRelationship.js";

describe("Talent Relationship & Chemistry Engine Tests", () => {
  it("normalizes actor pair IDs deterministically regardless of argument order", () => {
    const pair1 = normalizePair("actor_99", "actor_10", "Zack", "Alice");
    const pair2 = normalizePair("actor_10", "actor_99", "Alice", "Zack");

    assert.strictEqual(pair1.talentAId, "actor_10");
    assert.strictEqual(pair1.talentBId, "actor_99");
    assert.strictEqual(pair1.talentAName, "Alice");
    assert.strictEqual(pair1.talentBName, "Zack");

    assert.deepStrictEqual(pair1, pair2);
  });

  it("calculates positive chemistry modifiers for FRIENDSHIP", () => {
    const mods = calculateRelationshipModifiers(RELATIONSHIP_TYPES.FRIENDSHIP, 80);
    assert.ok(mods.chemistryModifier > 10);
    assert.ok(mods.audienceInterestModifier > 0);
  });

  it("calculates high chemistry and audience interest for ROMANTIC", () => {
    const mods = calculateRelationshipModifiers(RELATIONSHIP_TYPES.ROMANTIC, 90);
    assert.ok(mods.chemistryModifier >= 18);
    assert.ok(mods.audienceInterestModifier >= 0.2);
  });

  it("calculates negative chemistry penalty with audience drama intrigue for RIVALRY", () => {
    const mods = calculateRelationshipModifiers(RELATIONSHIP_TYPES.RIVALRY, 75);
    assert.ok(mods.chemistryModifier < 0);
    assert.ok(mods.audienceInterestModifier > 0); // Spices up box-office gossip
  });

  it("calculates negative chemistry penalty for BREAKUP", () => {
    const mods = calculateRelationshipModifiers(RELATIONSHIP_TYPES.BREAKUP, 60);
    assert.ok(mods.chemistryModifier <= -15);
    assert.ok(mods.audienceInterestModifier > 0.1);
  });

  it("calculates neutral modifiers for NEUTRAL relationship", () => {
    const mods = calculateRelationshipModifiers(RELATIONSHIP_TYPES.NEUTRAL, 50);
    assert.strictEqual(mods.chemistryModifier, 0);
    assert.strictEqual(mods.audienceInterestModifier, 0);
  });

  it("evaluates empty or single-actor cast gracefully", async () => {
    const resultSingle = await evaluateCastChemistry("mockUser", "actor_1", []);
    assert.strictEqual(resultSingle.netChemistryBonus, 0);
    assert.strictEqual(resultSingle.netAudienceBonus, 0);
    assert.strictEqual(resultSingle.conflicts.length, 0);
  });
});
