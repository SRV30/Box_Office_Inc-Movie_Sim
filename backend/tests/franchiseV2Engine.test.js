import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateCanonConsistency,
  calculateFranchiseFatigue,
  calculateUniverseBoxOfficeModifier,
  evaluateCrossMediaSynergy,
  evaluateAIFranchiseExpansion,
} from "../src/services/simulation/engines/franchiseV2Engine.js";

describe("V2 Franchise, Canon, Fatigue, and Universe Economy Tests", () => {
  it("validates canon continuity and flags inconsistent retcons and writer departures", () => {
    const consistentTimeline = [
      { title: "Part 1: Origin", narrativeType: "ORIGIN", leadWriterRetained: true },
      { title: "Part 2: Rising", narrativeType: "SEQUEL", leadWriterRetained: true },
      { title: "Part 3: Climax", narrativeType: "SEQUEL", leadWriterRetained: true },
    ];

    const brokenTimeline = [
      { title: "Part 1", narrativeType: "SEQUEL", leadWriterRetained: true },
      { title: "Part 2", narrativeType: "ORIGIN", leadWriterRetained: false },
      { title: "Part 3", narrativeType: "ORIGIN", leadWriterRetained: false },
    ];

    const cleanResult = validateCanonConsistency(consistentTimeline);
    const brokenResult = validateCanonConsistency(brokenTimeline);

    assert.strictEqual(cleanResult.loreScore, 100);
    assert.strictEqual(cleanResult.violations.length, 0);

    assert.ok(brokenResult.loreScore < 100);
    assert.ok(brokenResult.violations.length > 0);
  });

  it("calculates franchise fatigue for rapid releases and verifies decay on creative hiatus", () => {
    const rapidTimeline = [
      { title: "Release 1", releaseWeek: 5 },
      { title: "Release 2", releaseWeek: 10 },
      { title: "Release 3", releaseWeek: 15 },
      { title: "Release 4", releaseWeek: 20 },
    ];

    const fatigueActive = calculateFranchiseFatigue(22, rapidTimeline, false);
    const fatigueHiatus = calculateFranchiseFatigue(22, rapidTimeline, true);

    assert.ok(fatigueActive.fatigueScore > 0, "4 releases in 22 weeks should generate high audience fatigue");
    assert.ok(fatigueActive.fatiguePenaltyPercent > 0);
    assert.ok(
      fatigueHiatus.fatigueScore < fatigueActive.fatigueScore,
      "Creative hiatus must alleviate audience fatigue"
    );
  });

  it("calculates universe box office synergy and crossover event bonuses", () => {
    const universe = {
      loreConsistencyScore: 95,
      fanbaseSize: 4000000,
      prestigeLevel: 60,
      fatigueScore: 0,
      canonTimeline: [
        { title: "Hero A" },
        { title: "Hero B" },
        { title: "Hero C" },
      ],
    };

    const standaloneEntry = { narrativeType: "SEQUEL" };
    const crossoverEntry = { narrativeType: "CROSSOVER_EVENT" };

    const modStandalone = calculateUniverseBoxOfficeModifier(universe, standaloneEntry);
    const modCrossover = calculateUniverseBoxOfficeModifier(universe, crossoverEntry);

    assert.ok(modStandalone > 1.0, "Universe fanbase should provide base box office boost");
    assert.ok(
      modCrossover > modStandalone,
      "Crossover event uniting multiple heroes must yield higher box office synergy"
    );
  });

  it("evaluates cross-media synergy when movies and TV shows coexist in the same universe", () => {
    const crossMediaEntries = [
      { entryType: "MOVIE", title: "Galactic Wars" },
      { entryType: "TV_SHOW", title: "Galactic Wars: Academy" },
    ];

    const singleMediaEntries = [
      { entryType: "MOVIE", title: "Galactic Wars 1" },
      { entryType: "MOVIE", title: "Galactic Wars 2" },
    ];

    const synergyActive = evaluateCrossMediaSynergy(crossMediaEntries);
    const synergyNone = evaluateCrossMediaSynergy(singleMediaEntries);

    assert.strictEqual(synergyActive.hasSynergy, true);
    assert.ok(synergyActive.crossMediaBonusPercent > 0);
    assert.strictEqual(synergyNone.hasSynergy, false);
  });

  it("evaluates AI franchise expansion decisions based on universe fatigue", () => {
    const fatiguedUniverse = {
      canonTimeline: [
        { releaseWeek: 5 },
        { releaseWeek: 10 },
        { releaseWeek: 15 },
        { releaseWeek: 18 },
      ],
      inHiatus: false,
    };

    const freshUniverse = {
      canonTimeline: [{ releaseWeek: 1 }],
      inHiatus: false,
    };

    const aiFatigued = evaluateAIFranchiseExpansion(fatiguedUniverse, 20);
    const aiFresh = evaluateAIFranchiseExpansion(freshUniverse, 20);

    assert.strictEqual(aiFatigued.shouldExpand, false);
    assert.strictEqual(aiFatigued.recommendedType, "HIATUS");

    assert.strictEqual(aiFresh.shouldExpand, true);
  });
});
