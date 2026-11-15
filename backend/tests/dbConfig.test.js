import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPlaceholderMongoUri, validateMongoConfig } from "../src/config/db.js";

describe("Database Configuration & Production Fallback Prevention (issue #708)", () => {
  it("identifies default placeholder MongoDB URIs correctly", () => {
    assert.strictEqual(
      isPlaceholderMongoUri("mongodb+srv://user:pass@cluster.mongodb.net/dbname"),
      true
    );
    assert.strictEqual(isPlaceholderMongoUri("mongodb://user:pass@cluster.mongodb.net/dbname"), true);
    assert.strictEqual(isPlaceholderMongoUri(""), true);
    assert.strictEqual(isPlaceholderMongoUri(null), true);
    assert.strictEqual(isPlaceholderMongoUri(undefined), true);

    assert.strictEqual(
      isPlaceholderMongoUri("mongodb+srv://produser:StrongPass123@prodcluster.abcde.mongodb.net/boxoffice_prod"),
      false
    );
    assert.strictEqual(isPlaceholderMongoUri("mongodb://127.0.0.1:27017/boxoffice_local"), false);
  });

  it("fails fast in production when MONGO_URI is a placeholder", () => {
    assert.throws(
      () =>
        validateMongoConfig({
          NODE_ENV: "production",
          MONGO_URI: "mongodb+srv://user:pass@cluster.mongodb.net/dbname",
        }),
      /persistent MongoDB instance/
    );
  });

  it("fails fast in production when MONGO_URI has invalid protocol", () => {
    assert.throws(
      () =>
        validateMongoConfig({
          NODE_ENV: "production",
          MONGO_URI: "postgres://produser:secret@localhost:5432/db",
        }),
      /valid URI starting with mongodb/
    );
  });

  it("succeeds in production with a valid persistent connection string", () => {
    const validConfig = {
      NODE_ENV: "production",
      MONGO_URI: "mongodb+srv://realadmin:veryStrongPassword99@cluster0.net/production_db",
    };
    assert.strictEqual(validateMongoConfig(validConfig), true);
  });

  it("permits placeholder strings in development and test environments", () => {
    assert.strictEqual(
      validateMongoConfig({
        NODE_ENV: "development",
        MONGO_URI: "mongodb+srv://user:pass@cluster.mongodb.net/dbname",
      }),
      true
    );

    assert.strictEqual(
      validateMongoConfig({
        NODE_ENV: "test",
        MONGO_URI: "mongodb://127.0.0.1:27017/boxoffice-test",
      }),
      true
    );
  });
});
