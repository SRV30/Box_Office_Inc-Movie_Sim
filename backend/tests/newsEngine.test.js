import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateHypeEffect,
  calculateReputationEffect,
  applyNewsEffects,
  publishNewsArticle,
  generateNewsFromRelease,
  generateNewsFromTrend,
  generateNewsFromScandal,
} from "../src/services/simulation/engines/newsEngine.js";
import { NEWS_SENTIMENTS } from "../src/constants/newsMedia.js";
import NewsItem from "../src/models/NewsItem.js";

describe("Dynamic News & Media Engine (issue #543)", () => {
  it("calculates bounded hype effects from sentiment and reach", () => {
    const positive = calculateHypeEffect(NEWS_SENTIMENTS.POSITIVE, 80, 85);
    const negative = calculateHypeEffect(NEWS_SENTIMENTS.NEGATIVE, 80, 85);
    const neutral = calculateHypeEffect(NEWS_SENTIMENTS.NEUTRAL, 80, 85);

    assert.ok(positive > 0 && positive <= 5);
    assert.ok(negative < 0 && negative >= -3);
    assert.strictEqual(neutral, 0);
  });

  it("calculates bounded reputation effects from sentiment and reach", () => {
    const positive = calculateReputationEffect(NEWS_SENTIMENTS.POSITIVE, 90, 80);
    const negative = calculateReputationEffect(NEWS_SENTIMENTS.NEGATIVE, 90, 80);

    assert.ok(positive > 0 && positive <= 3);
    assert.ok(negative < 0 && negative >= -8);
  });

  it("applies article effects to studio and movie within bounds", () => {
    const studio = { reputation: 50 };
    const movie = { hype: 40 };
    const article = { reputationEffect: 5, hypeEffect: 4 };

    applyNewsEffects(article, studio, movie);

    assert.strictEqual(studio.reputation, 55);
    assert.strictEqual(movie.hype, 44);
  });

  it("publishNewsArticle deduplicates by dedupeKey", async () => {
    const originalFindOne = NewsItem.findOne;
    const originalCreate = NewsItem.create;
    let createCount = 0;
    const store = new Map();

    NewsItem.findOne = async ({ dedupeKey }) => store.get(dedupeKey) || null;
    NewsItem.create = async (payload) => {
      createCount++;
      store.set(payload.dedupeKey, payload);
      return payload;
    };

    try {
      await publishNewsArticle({
        type: "trend",
        headline: "Test",
        body: "Body",
        week: 1,
        dedupeKey: "trend:Action:1",
      });
      const dup = await publishNewsArticle({
        type: "trend",
        headline: "Test Duplicate",
        body: "Body",
        week: 1,
        dedupeKey: "trend:Action:1",
      });

      assert.strictEqual(createCount, 1);
      assert.strictEqual(dup.headline, "Test");
    } finally {
      NewsItem.findOne = originalFindOne;
      NewsItem.create = originalCreate;
    }
  });

  it("generateNewsFromRelease creates box office and review articles", async () => {
    const originalCreate = NewsItem.create;
    const originalFindOne = NewsItem.findOne;
    const created = [];

    NewsItem.findOne = async () => null;
    NewsItem.create = async (payload) => {
      created.push(payload);
      return payload;
    };

    try {
      const movie = {
        _id: "movie123",
        title: "Super Hit",
        verdict: "HIT",
        criticScore: 82,
        worldwideGross: 15000000,
        budget: 5000000,
      };
      const studio = { _id: "studio123", name: "Paramount Works" };

      await generateNewsFromRelease(movie, studio, 5);

      assert.strictEqual(created.length, 2);
      assert.ok(created.some((a) => a.type === "box_office"));
      assert.ok(created.some((a) => a.type === "review"));
      assert.ok(created[0].source?.credibility > 0);
      assert.ok(created[0].entityLinks?.length > 0);
    } finally {
      NewsItem.create = originalCreate;
      NewsItem.findOne = originalFindOne;
    }
  });

  it("generateNewsFromTrend creates trend article with dedupe key", async () => {
    const originalCreate = NewsItem.create;
    const originalFindOne = NewsItem.findOne;
    let createdPayload = null;

    NewsItem.findOne = async () => null;
    NewsItem.create = async (payload) => {
      createdPayload = payload;
      return payload;
    };

    try {
      await generateNewsFromTrend({ genre: "Sci-Fi" }, 10);

      assert.equal(createdPayload.type, "trend");
      assert.ok(createdPayload.headline.includes("Sci-Fi"));
      assert.strictEqual(createdPayload.dedupeKey, "trend:Sci-Fi:10");
      assert.strictEqual(createdPayload.sentiment, NEWS_SENTIMENTS.POSITIVE);
    } finally {
      NewsItem.create = originalCreate;
      NewsItem.findOne = originalFindOne;
    }
  });

  it("generateNewsFromScandal creates negative sentiment scandal article", async () => {
    const originalCreate = NewsItem.create;
    const originalFindOne = NewsItem.findOne;
    let createdPayload = null;

    NewsItem.findOne = async () => null;
    NewsItem.create = async (payload) => {
      createdPayload = payload;
      return payload;
    };

    try {
      const scandal = { id: "actor-arrested", description: "An actor was arrested." };
      const studio = { _id: "studio456", name: "Test Studio" };

      await generateNewsFromScandal(scandal, studio, 7);

      assert.equal(createdPayload.type, "scandal");
      assert.strictEqual(createdPayload.sentiment, NEWS_SENTIMENTS.NEGATIVE);
      assert.ok(createdPayload.reputationEffect < 0);
      assert.ok(createdPayload.headline.includes("SCANDAL"));
    } finally {
      NewsItem.create = originalCreate;
      NewsItem.findOne = originalFindOne;
    }
  });
});
