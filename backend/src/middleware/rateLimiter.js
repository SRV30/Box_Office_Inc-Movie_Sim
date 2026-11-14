import mongoose from "mongoose";
import rateLimit, { MemoryStore } from "express-rate-limit";

/**
 * Shared MongoDB Store for express-rate-limit
 * Enables distributed rate limiting across multiple server instances and processes.
 */
export class MongoRateLimitStore {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000;
    this.collectionName = options.collectionName || "ratelimits";
    this.prefix = options.prefix || "rl";
    this.fallbackStore = new Map();
  }

  init(options) {
    if (options && options.windowMs) {
      this.windowMs = options.windowMs;
    }
  }

  _isMongoAvailable() {
    return mongoose.connection && mongoose.connection.readyState === 1;
  }

  _getCollection() {
    return mongoose.connection.collection(this.collectionName);
  }

  async increment(key) {
    const fullKey = `${this.prefix}:${key}`;
    const now = Date.now();
    const resetTime = new Date(now + this.windowMs);

    if (this._isMongoAvailable()) {
      try {
        const collection = this._getCollection();
        const doc = await collection.findOneAndUpdate(
          { _id: fullKey },
          {
            $inc: { totalHits: 1 },
            $setOnInsert: { expireAt: resetTime },
          },
          { upsert: true, returnDocument: "after" }
        );

        const totalHits = doc?.totalHits || 1;
        const docReset = doc?.expireAt ? new Date(doc.expireAt) : resetTime;
        return {
          totalHits,
          resetTime: docReset,
        };
      } catch (err) {
        // Fall back to memory on transient database error
      }
    }

    // In-memory fallback
    let entry = this.fallbackStore.get(fullKey);
    if (!entry || now > entry.resetTime.getTime()) {
      entry = { totalHits: 0, resetTime };
      this.fallbackStore.set(fullKey, entry);
    }
    entry.totalHits += 1;
    return {
      totalHits: entry.totalHits,
      resetTime: entry.resetTime,
    };
  }

  async decrement(key) {
    const fullKey = `${this.prefix}:${key}`;
    if (this._isMongoAvailable()) {
      try {
        const collection = this._getCollection();
        await collection.updateOne({ _id: fullKey }, { $inc: { totalHits: -1 } });
        return;
      } catch (err) {
        // Fall back to memory
      }
    }

    const entry = this.fallbackStore.get(fullKey);
    if (entry && entry.totalHits > 0) {
      entry.totalHits -= 1;
    }
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}:${key}`;
    if (this._isMongoAvailable()) {
      try {
        const collection = this._getCollection();
        await collection.deleteOne({ _id: fullKey });
      } catch (err) {
        // Fall back to memory
      }
    }
    this.fallbackStore.delete(fullKey);
  }

  async resetAll() {
    if (this._isMongoAvailable()) {
      try {
        const collection = this._getCollection();
        await collection.deleteMany({ _id: new RegExp(`^${this.prefix}:`) });
      } catch (err) {
        // Fall back to memory
      }
    }
    this.fallbackStore.clear();
  }
}

/**
 * Creates a rate limiter instance with unified policy and shared storage.
 */
export const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || options.max || 100;
  const keyPrefix = options.keyPrefix || "global";

  const useMongo =
    process.env.RATE_LIMIT_STORE === "mongodb" ||
    (process.env.NODE_ENV === "production" && process.env.RATE_LIMIT_STORE !== "memory");

  const store = useMongo
    ? new MongoRateLimitStore({ windowMs, prefix: keyPrefix })
    : new MemoryStore();

  return rateLimit({
    windowMs,
    limit: maxRequests,
    standardHeaders: "draft-7",
    legacyHeaders: true,
    store,
    validate: false,
    keyGenerator: (req) => req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
    skip: (req) => {
      if (typeof options.skip === "function" && options.skip(req)) return true;
      if (process.env.NODE_ENV === "test" && process.env.ENABLE_RATE_LIMIT_IN_TEST !== "true") {
        return true;
      }
      return false;
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    },
  });
};

export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  keyPrefix: "auth",
});

export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 200,
  keyPrefix: "api",
});

export const simulationRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: "simulation",
});

export default rateLimiter;
