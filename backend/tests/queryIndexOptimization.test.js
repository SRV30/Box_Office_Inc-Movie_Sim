import "./helpers/testEnv.js";
import test from "node:test";
import assert from "node:assert";
import TalentHistory from "../src/models/TalentHistory.js";
import Movie from "../src/models/Movie.js";

test("Database Schema Index Optimization (#714)", () => {
  const talentIndexes = TalentHistory.schema.indexes();
  const hasCompositeTypeIndex = talentIndexes.some(
    ([fields]) => fields.gameStateId === 1 && fields.type === 1 && fields.createdAt === -1
  );
  assert.strictEqual(hasCompositeTypeIndex, true);

  const movieIndexes = Movie.schema.indexes();
  const hasStudioStatusReleaseIndex = movieIndexes.some(
    ([fields]) => fields.studioId === 1 && fields.status === 1 && fields.releaseWeek === -1
  );
  assert.strictEqual(hasStudioStatusReleaseIndex, true);
});
