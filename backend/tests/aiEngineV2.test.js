import { describe, it } from "node:test";
import assert from "node:assert";
import {
  V2_STRATEGIES,
  V2_STRATEGY_PROFILES,
} from "../src/services/simulation/engines/aiEngineV2.js";

describe("AI Studio V2 Strategy Unit Tests", () => {
  it("initializes all 5 V2 strategy profiles with distinct budget and risk characteristics", () => {
    assert.strictEqual(Object.keys(V2_STRATEGY_PROFILES).length, 5);
    
    const blockbuster = V2_STRATEGY_PROFILES[V2_STRATEGIES.BLOCKBUSTER_FACTORY];
    const indie = V2_STRATEGY_PROFILES[V2_STRATEGIES.INDIE_DARLING];

    assert.ok(blockbuster.budgetRange.min > indie.budgetRange.max);
    assert.strictEqual(blockbuster.riskTolerance, "HIGH");
    assert.strictEqual(indie.riskTolerance, "LOW");
  });

  it("allocates streaming budget shares correctly for Streaming Giant strategy", () => {
    const streaming = V2_STRATEGY_PROFILES[V2_STRATEGIES.STREAMING_GIANT];
    assert.strictEqual(streaming.streamingShare, 0.3);
  });
});
