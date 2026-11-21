import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import { createMovieSchema } from "../src/validators/movieValidator.js";

test("createMovieSchema accepts valid UUID and custom IDs for in-game talent and scripts", () => {
  const validPayload = {
    title: "Inception 2",
    scriptId: crypto.randomUUID(),
    directorId: crypto.randomUUID(),
    leadActorId: crypto.randomUUID(),
    crewTeamId: crypto.randomUUID(),
    marketingCampaignIds: ["trailer", "social"],
    franchiseId: "",
    createFranchise: false,
    franchiseName: "",
  };

  const parsed = createMovieSchema.safeParse(validPayload);
  assert.strictEqual(parsed.success, true);
});

test("createMovieSchema rejects missing required fields with clear messages", () => {
  const invalidPayload = {
    title: "",
    scriptId: "123",
  };

  const parsed = createMovieSchema.safeParse(invalidPayload);
  assert.strictEqual(parsed.success, false);
  const errors = parsed.error.format();
  assert.ok(errors.title);
  assert.ok(errors.directorId);
  assert.ok(errors.leadActorId);
  assert.ok(errors.crewTeamId);
});
