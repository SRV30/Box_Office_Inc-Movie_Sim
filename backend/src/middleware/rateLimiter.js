const requestCounts = new Map();

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 100;

export const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
  const maxRequests = options.maxRequests || DEFAULT_MAX_REQUESTS;
  const keyPrefix = options.keyPrefix || "global";

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let entry = requestCounts.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { windowStart: now, count: 0 };
      requestCounts.set(key, entry);

      if (entry.timer) clearTimeout(entry.timer);
      entry.timer = setTimeout(() => {
        if (requestCounts.get(key) === entry) {
          requestCounts.delete(key);
        }
      }, windowMs);
      if (timer && typeof timer.unref === "function") {
        timer.unref();
      }
    }

    entry.count++;

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil((entry.windowStart + windowMs) / 1000));

    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  };
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
