import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateProductionSecrets, KNOWN_PLACEHOLDER_SECRETS } from "../src/config/envConfig.js";

describe("Production JWT Secret Validation Tests (issue #707)", () => {
  const validAccessSecret = "a_very_secure_production_access_token_secret_1234567890";
  const validRefreshSecret = "a_very_secure_production_refresh_token_secret_1234567890";

  it("passes when strong, distinct secrets are supplied in production", () => {
    const env = {
      NODE_ENV: "production",
      JWT_ACCESS_SECRET: validAccessSecret,
      JWT_REFRESH_SECRET: validRefreshSecret,
    };
    assert.strictEqual(validateProductionSecrets(env), true);
  });

  it("permits dev/test environments without strict production secret checks", () => {
    const devEnv = {
      NODE_ENV: "development",
      JWT_ACCESS_SECRET: "short",
      JWT_REFRESH_SECRET: "short",
    };
    assert.strictEqual(validateProductionSecrets(devEnv), true);

    const testEnv = {
      NODE_ENV: "test",
      JWT_ACCESS_SECRET: "test-access-secret-not-for-production",
      JWT_REFRESH_SECRET: "test-refresh-secret-not-for-production",
    };
    assert.strictEqual(validateProductionSecrets(testEnv), true);
  });

  it("rejects missing secrets in production", () => {
    assert.throws(
      () =>
        validateProductionSecrets({
          NODE_ENV: "production",
          JWT_ACCESS_SECRET: "",
          JWT_REFRESH_SECRET: validRefreshSecret,
        }),
      /Missing JWT_ACCESS_SECRET/
    );

    assert.throws(
      () =>
        validateProductionSecrets({
          NODE_ENV: "production",
          JWT_ACCESS_SECRET: validAccessSecret,
          JWT_REFRESH_SECRET: undefined,
        }),
      /Missing JWT_ACCESS_SECRET/
    );
  });

  it("rejects known development and test placeholder secrets in production", () => {
    for (const placeholder of KNOWN_PLACEHOLDER_SECRETS) {
      assert.throws(
        () =>
          validateProductionSecrets({
            NODE_ENV: "production",
            JWT_ACCESS_SECRET: placeholder,
            JWT_REFRESH_SECRET: validRefreshSecret,
          }),
        /insecure development placeholder/
      );

      assert.throws(
        () =>
          validateProductionSecrets({
            NODE_ENV: "production",
            JWT_ACCESS_SECRET: validAccessSecret,
            JWT_REFRESH_SECRET: placeholder,
          }),
        /insecure development placeholder/
      );
    }
  });

  it("rejects secrets shorter than 32 characters in production", () => {
    assert.throws(
      () =>
        validateProductionSecrets({
          NODE_ENV: "production",
          JWT_ACCESS_SECRET: "too_short_secret_under_32",
          JWT_REFRESH_SECRET: validRefreshSecret,
        }),
      /at least 32 characters/
    );

    assert.throws(
      () =>
        validateProductionSecrets({
          NODE_ENV: "production",
          JWT_ACCESS_SECRET: validAccessSecret,
          JWT_REFRESH_SECRET: "too_short_refresh_secret",
        }),
      /at least 32 characters/
    );
  });

  it("rejects identical access and refresh token secrets in production", () => {
    assert.throws(
      () =>
        validateProductionSecrets({
          NODE_ENV: "production",
          JWT_ACCESS_SECRET: validAccessSecret,
          JWT_REFRESH_SECRET: validAccessSecret,
        }),
      /must not be identical/
    );
  });
});
