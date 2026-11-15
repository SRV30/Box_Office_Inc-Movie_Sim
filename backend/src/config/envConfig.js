import dotenv from "dotenv";

dotenv.config();

// Known development and test secrets that must NEVER be used in production
export const KNOWN_PLACEHOLDER_SECRETS = [
  "box_office_inc_dev_access_token_secret_key_32chars",
  "box_office_inc_dev_refresh_token_secret_key_32chars",
  "test-access-secret-not-for-production",
  "test-refresh-secret-not-for-production",
  "secret",
  "jwtsecret",
  "jwt_secret",
  "changeme",
  "placeholder",
  "your_jwt_secret",
  "your-secret-key",
  "default_secret",
];

export const validateProductionSecrets = (envVars = process.env) => {
  if (envVars.NODE_ENV !== "production") return true;

  const access = envVars.JWT_ACCESS_SECRET;
  const refresh = envVars.JWT_REFRESH_SECRET;

  if (!access || !refresh) {
    throw new Error("CRITICAL: Missing JWT_ACCESS_SECRET or JWT_REFRESH_SECRET in production.");
  }

  const isPlaceholder = (secret) => {
    const s = secret.trim().toLowerCase();
    return KNOWN_PLACEHOLDER_SECRETS.some(
      (p) => s === p.toLowerCase() || s.includes("changeme") || s.includes("placeholder")
    );
  };

  if (isPlaceholder(access)) {
    throw new Error(
      "CRITICAL: Production startup rejected: JWT_ACCESS_SECRET contains an insecure development placeholder."
    );
  }

  if (isPlaceholder(refresh)) {
    throw new Error(
      "CRITICAL: Production startup rejected: JWT_REFRESH_SECRET contains an insecure development placeholder."
    );
  }

  if (access.length < 32) {
    throw new Error(
      `CRITICAL: JWT_ACCESS_SECRET must be at least 32 characters in production (got ${access.length}).`
    );
  }

  if (refresh.length < 32) {
    throw new Error(
      `CRITICAL: JWT_REFRESH_SECRET must be at least 32 characters in production (got ${refresh.length}).`
    );
  }

  if (access === refresh) {
    throw new Error(
      "CRITICAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be identical in production."
    );
  }

  return true;
};

// In production, strictly enforce all required environment variables
if (process.env.NODE_ENV === "production") {
  const requiredEnvVars = [
    "MONGO_URI",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "CLIENT_URL",
  ];

  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `CRITICAL: Missing required environment variables: ${missingEnvVars.join(", ")}. Check your .env file.`,
    );
  }

  validateProductionSecrets(process.env);
}

// Development / test defaults for zero-config onboarding
const devDefaultMongoUri = "mongodb+srv://user:pass@cluster.mongodb.net/dbname";
const devDefaultAccessSecret = "box_office_inc_dev_access_token_secret_key_32chars";
const devDefaultRefreshSecret = "box_office_inc_dev_refresh_token_secret_key_32chars";
const devDefaultClientUrl = "http://localhost:5173";

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,

  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: process.env.MONGO_URI || devDefaultMongoUri,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || devDefaultAccessSecret,

  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || devDefaultRefreshSecret,

  JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE || "15m",

  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || "30d",

  CLIENT_URL: process.env.CLIENT_URL || devDefaultClientUrl,

  BANKRUPTCY_THRESHOLD_WEEKS: Math.max(1, parseInt(process.env.BANKRUPTCY_THRESHOLD_WEEKS, 10) || 4),

  MAX_ACTIVE_LOANS: Math.max(1, parseInt(process.env.MAX_ACTIVE_LOANS, 10) || 3),

  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "combined" : "dev"),

  RATE_LIMIT_STORE: process.env.RATE_LIMIT_STORE || (process.env.NODE_ENV === "production" ? "mongodb" : "memory"),

  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 30000,
};

export default env;
