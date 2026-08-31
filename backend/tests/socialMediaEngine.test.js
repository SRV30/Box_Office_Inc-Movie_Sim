import { describe, it } from "node:test";
import assert from "node:assert";
import {
  deterministicRandom,
  createSeededRng,
  calculatePlatformEngagement,
  calculateViralHypeBoost,
  getSocialBoxOfficeMultiplier,
  generateSocialEventsFromState,
} from "../src/services/simulation/engines/socialMediaEngine.js";
import {
  SOCIAL_PLATFORMS,
  SOCIAL_EVENT_TYPES,
} from "../src/constants/socialPlatforms.js";

describe("Social Media Engine Tests (issue #534)", () => {
  it("produces deterministic random values for the same seed", () => {
    const a = deterministicRandom(534001);
    const b = deterministicRandom(534001);
    const c = deterministicRandom(534002);

    assert.strictEqual(a, b);
    assert.notStrictEqual(a, c);
    assert.ok(a >= 0 && a < 1);
  });

  it("creates reproducible RNG sequences when seeded", () => {
    const rng1 = createSeededRng("user123", 10, 0);
    const rng2 = createSeededRng("user123", 10, 0);

    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];

    assert.deepStrictEqual(seq1, seq2);
  });

  it("calculates distinct engagement per platform", () => {
    const rng = () => 0.5;
    const instagram = calculatePlatformEngagement(SOCIAL_PLATFORMS.INSTAGRAM, ["Romance"], 10000, rng);
    const tiktok = calculatePlatformEngagement(SOCIAL_PLATFORMS.TIKTOK, ["Horror"], 10000, rng);
    const youtube = calculatePlatformEngagement(SOCIAL_PLATFORMS.YOUTUBE, ["Action"], 10000, rng);

    assert.ok(tiktok.engagement > youtube.engagement, "TikTok should have higher base engagement than YouTube");
    assert.ok(instagram.impressions > 0);
    assert.ok(tiktok.impressions > 0);
  });

  it("calculates bounded viral hype boost", () => {
    const movie = { title: "Test Movie", genre: "Horror" };
    const account = { platform: SOCIAL_PLATFORMS.TIKTOK, followers: 50000, viralMomentum: 40 };
    const boost = calculateViralHypeBoost(SOCIAL_PLATFORMS.TIKTOK, movie, account, () => 0.5);

    assert.ok(boost >= 0 && boost <= 12);
    assert.ok(boost > 0);
  });

  it("returns bounded box office multiplier", () => {
    const low = getSocialBoxOfficeMultiplier([{ viralMomentum: 0 }]);
    const high = getSocialBoxOfficeMultiplier([{ viralMomentum: 100 }, { viralMomentum: 100 }]);

    assert.strictEqual(low, 1);
    assert.ok(high >= 1 && high <= 1.15);
  });

  it("generates positive viral trailer events for high-hype movies", async () => {
    const movies = [
      { _id: "movie1", title: "Blockbuster", hype: 75, status: "PRODUCTION", genre: "Action" },
    ];
    const accounts = [{ platform: SOCIAL_PLATFORMS.YOUTUBE, followers: 20000 }];
    const studio = { reputation: 90 };

    let callCount = 0;
    const rng = () => {
      callCount++;
      return callCount === 1 ? 0.05 : 0.99;
    };

    const events = await generateSocialEventsFromState({
      userId: "507f1f77bcf86cd799439011",
      week: 5,
      studio,
      movies,
      accounts,
      rng,
      relationships: [],
    });

    const viralEvent = events.find((e) => e.eventType === SOCIAL_EVENT_TYPES.VIRAL_TRAILER);
    assert.ok(viralEvent, "Should generate a viral trailer event");
    assert.strictEqual(viralEvent.sentiment, "positive");
    assert.ok(viralEvent.hypeDelta > 0);
    assert.strictEqual(viralEvent.reputationDelta, 0);
  });

  it("generates negative cancel-culture events for low reputation studios", async () => {
    const movies = [];
    const accounts = [{ platform: SOCIAL_PLATFORMS.X, followers: 5000 }];
    const studio = { reputation: 55 };

    let callCount = 0;
    const rng = () => {
      callCount++;
      return callCount === 1 ? 0.01 : 0.99;
    };

    const events = await generateSocialEventsFromState({
      userId: "507f1f77bcf86cd799439011",
      week: 10,
      studio,
      movies,
      accounts,
      rng,
      relationships: [],
    });

    const cancelEvent = events.find((e) => e.eventType === SOCIAL_EVENT_TYPES.CANCEL_CULTURE);
    assert.ok(cancelEvent, "Should generate a cancel-culture event for low reputation");
    assert.strictEqual(cancelEvent.sentiment, "negative");
    assert.ok(cancelEvent.reputationDelta < 0);
  });

  it("generates negative spoiler events for movies ready for release", async () => {
    const movies = [
      { _id: "movie2", title: "Secret Sequel", status: "READY_FOR_RELEASE", genre: "Thriller" },
    ];
    const accounts = [{ platform: SOCIAL_PLATFORMS.TIKTOK, followers: 30000 }];
    const studio = { reputation: 80 };

    let callCount = 0;
    const rng = () => {
      callCount++;
      if (callCount === 1) return 0.01;
      if (callCount === 2) return 0.3;
      return 0.1;
    };

    const events = await generateSocialEventsFromState({
      userId: "507f1f77bcf86cd799439011",
      week: 15,
      studio,
      movies,
      accounts,
      rng,
      relationships: [],
    });

    const leakOrSpoiler = events.find(
      (e) => e.eventType === SOCIAL_EVENT_TYPES.SPOILER || e.eventType === SOCIAL_EVENT_TYPES.LEAK
    );
    assert.ok(leakOrSpoiler, "Should generate leak or spoiler event");
    assert.strictEqual(leakOrSpoiler.sentiment, "negative");
  });
});
