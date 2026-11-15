import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MongoRateLimitStore, rateLimiter } from "../src/middleware/rateLimiter.js";

describe("Shared API Rate Limiter Policy & Storage Tests (issue #706)", () => {
  let store;

  beforeEach(() => {
    store = new MongoRateLimitStore({ windowMs: 1000, prefix: "test" });
  });

  it("increments hits and provides resetTime using fallback store", async () => {
    const res1 = await store.increment("ip-1");
    assert.strictEqual(res1.totalHits, 1);
    assert.ok(res1.resetTime instanceof Date);

    const res2 = await store.increment("ip-1");
    assert.strictEqual(res2.totalHits, 2);

    const resOther = await store.increment("ip-2");
    assert.strictEqual(resOther.totalHits, 1);
  });

  it("decrements hits correctly", async () => {
    await store.increment("ip-dec");
    await store.increment("ip-dec");
    await store.decrement("ip-dec");

    const res = await store.increment("ip-dec");
    assert.strictEqual(res.totalHits, 2);
  });

  it("resets key counters cleanly", async () => {
    await store.increment("ip-reset");
    await store.increment("ip-reset");
    await store.resetKey("ip-reset");

    const res = await store.increment("ip-reset");
    assert.strictEqual(res.totalHits, 1);
  });

  it("enforces rate limits and sets 429 when limit is reached", async () => {
    process.env.ENABLE_RATE_LIMIT_IN_TEST = "true";

    try {
      const limiter = rateLimiter({
        windowMs: 5000,
        maxRequests: 2,
        keyPrefix: "unit-test",
      });

      const mockReq = {
        ip: "192.168.1.100",
        headers: {},
      };

      const recordedHeaders = {};
      let statusCode = 200;
      let responseBody = null;

      const createMockRes = () => ({
        setHeader: (name, val) => {
          recordedHeaders[name.toLowerCase()] = val;
        },
        getHeader: (name) => recordedHeaders[name.toLowerCase()],
        status: (code) => {
          statusCode = code;
          return {
            json: (body) => {
              responseBody = body;
            },
          };
        },
      });

      // Request 1: allowed
      await new Promise((resolve) => limiter(mockReq, createMockRes(), resolve));
      assert.strictEqual(statusCode, 200);

      // Request 2: allowed
      await new Promise((resolve) => limiter(mockReq, createMockRes(), resolve));
      assert.strictEqual(statusCode, 200);

      // Request 3: blocked with 429
      await new Promise((resolve) => {
        const next = () => resolve();
        const res = createMockRes();
        const originalJson = res.status(200).json;
        res.status = (code) => {
          statusCode = code;
          return {
            json: (body) => {
              responseBody = body;
              resolve();
            },
          };
        };
        limiter(mockReq, res, next);
      });

      assert.strictEqual(statusCode, 429);
      assert.strictEqual(responseBody?.success, false);
      assert.ok(responseBody?.message?.includes("Too many requests"));
    } finally {
      delete process.env.ENABLE_RATE_LIMIT_IN_TEST;
    }
  });

  it("skips rate limiting during testing when ENABLE_RATE_LIMIT_IN_TEST is not set", async () => {
    delete process.env.ENABLE_RATE_LIMIT_IN_TEST;
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";

    try {
      const limiter = rateLimiter({
        windowMs: 1000,
        maxRequests: 1,
      });

      let passedCount = 0;
      const mockReq = { ip: "10.0.0.1", headers: {} };
      const mockRes = { setHeader: () => {}, getHeader: () => {} };

      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => limiter(mockReq, mockRes, () => {
          passedCount++;
          resolve();
        }));
      }

      assert.strictEqual(passedCount, 5, "All requests should pass in test mode without error");
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });
});
