import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import { createMovieSchema } from "../src/validators/movieValidator.js";

test("createMovieSchema accepts soundtrackTier and co-production options", () => {
  const payload = {
    title: "Galactic Harmony",
    scriptId: crypto.randomUUID(),
    directorId: crypto.randomUUID(),
    leadActorId: crypto.randomUUID(),
    crewTeamId: crypto.randomUUID(),
    soundtrackTier: "PREMIUM",
    coProducerStudioId: "507f1f77bcf86cd799439011",
    coProducerShare: "25",
  };

  const parsed = createMovieSchema.safeParse(payload);
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.data.soundtrackTier, "PREMIUM");
  assert.strictEqual(parsed.data.coProducerShare, 25);
  assert.strictEqual(parsed.data.coProducerStudioId, "507f1f77bcf86cd799439011");
});

test("createMovieSchema rejects invalid soundtrackTier and out-of-bounds coProducerShare", () => {
  const invalidSoundtrack = {
    title: "Bad Soundtrack",
    scriptId: crypto.randomUUID(),
    directorId: crypto.randomUUID(),
    leadActorId: crypto.randomUUID(),
    crewTeamId: crypto.randomUUID(),
    soundtrackTier: "INVALID_TIER",
  };
  assert.strictEqual(createMovieSchema.safeParse(invalidSoundtrack).success, false);

  const invalidShare = {
    title: "Too Greedy",
    scriptId: crypto.randomUUID(),
    directorId: crypto.randomUUID(),
    leadActorId: crypto.randomUUID(),
    crewTeamId: crypto.randomUUID(),
    coProducerShare: 75,
  };
  assert.strictEqual(createMovieSchema.safeParse(invalidShare).success, false);
});
