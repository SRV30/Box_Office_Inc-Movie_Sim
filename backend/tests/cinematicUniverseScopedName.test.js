import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { createCinematicUniverse } from "../src/controllers/cinematicUniverseController.js";
import CinematicUniverse from "../src/models/CinematicUniverse.js";

test("Cinematic Universe: universeName uniqueness is scoped per studio", async () => {
  const indexes = CinematicUniverse.schema.indexes();
  const hasScopedIndex = indexes.some(
    ([fields]) => fields.studioId === 1 && fields.universeName === 1
  );
  assert.strictEqual(hasScopedIndex, true);

  // Assert schema level doesn't enforce global uniqueness on universeName path
  assert.strictEqual(CinematicUniverse.schema.path("universeName").options.unique, undefined);
});
