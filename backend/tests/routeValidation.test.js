import "./helpers/testEnv.js";

import test from "node:test";
import assert from "node:assert";
import { z } from "zod";
import { validate } from "../src/middleware/validationMiddleware.js";
import {
  objectIdString,
  updateFanClubBudgetSchema,
  launchPRCampaignSchema,
  buyUpgradeSchema,
  createCinematicUniverseSchema,
  addMovieToUniverseSchema,
  createSpinoffSchema,
  createCrossoverSchema,
  issueBondSchema,
  startAwardsCampaignSchema,
  testScreeningSchema,
  orderReshootsSchema,
  createAuctionSchema,
  executeAuctionBidSchema,
  merchandiseValuationSchema,
  merchandiseDealSchema,
  notificationIdParamSchema,
  simulateWeekSchema,
} from "../src/validators/gameplayValidators.js";

test("Zod validation schemas for mutation routes", async (t) => {
  const validObjectId = "507f1f77bcf86cd799439011";
  const invalidObjectId = "invalid-id-not-24-hex";

  await t.test("objectIdString validates 24-character hexadecimal ObjectId strings", () => {
    assert.strictEqual(objectIdString.safeParse(validObjectId).success, true);
    assert.strictEqual(objectIdString.safeParse(invalidObjectId).success, false);
    assert.strictEqual(objectIdString.safeParse("").success, false);
    assert.strictEqual(objectIdString.safeParse(12345).success, false);
  });

  await t.test("updateFanClubBudgetSchema accepts valid non-negative budgets and rejects negative ones", async () => {
    const valid = await updateFanClubBudgetSchema.body.safeParseAsync({ weeklyBudget: 50000 });
    assert.strictEqual(valid.success, true);

    const zero = await updateFanClubBudgetSchema.body.safeParseAsync({ weeklyBudget: 0 });
    assert.strictEqual(zero.success, true);

    const invalid = await updateFanClubBudgetSchema.body.safeParseAsync({ weeklyBudget: -500 });
    assert.strictEqual(invalid.success, false);
  });

  await t.test("launchPRCampaignSchema requires non-empty campaignId", async () => {
    const valid = await launchPRCampaignSchema.body.safeParseAsync({ campaignId: "grassroots_campaign" });
    assert.strictEqual(valid.success, true);

    const invalid = await launchPRCampaignSchema.body.safeParseAsync({ campaignId: "" });
    assert.strictEqual(invalid.success, false);
  });

  await t.test("buyUpgradeSchema validates upgradeId string", async () => {
    const valid = await buyUpgradeSchema.body.safeParseAsync({ upgradeId: "soundstage_tier_2" });
    assert.strictEqual(valid.success, true);

    const invalid = await buyUpgradeSchema.body.safeParseAsync({});
    assert.strictEqual(invalid.success, false);
  });

  await t.test("createCinematicUniverseSchema requires universeName", async () => {
    const valid = await createCinematicUniverseSchema.body.safeParseAsync({ universeName: "Marvelous Universe" });
    assert.strictEqual(valid.success, true);

    const invalid = await createCinematicUniverseSchema.body.safeParseAsync({ universeName: "" });
    assert.strictEqual(invalid.success, false);
  });

  await t.test("addMovieToUniverseSchema requires valid universeId and movieId ObjectIds", async () => {
    const valid = await addMovieToUniverseSchema.body.safeParseAsync({
      universeId: validObjectId,
      movieId: validObjectId,
    });
    assert.strictEqual(valid.success, true);

    const invalid = await addMovieToUniverseSchema.body.safeParseAsync({
      universeId: invalidObjectId,
      movieId: validObjectId,
    });
    assert.strictEqual(invalid.success, false);
  });

  await t.test("createSpinoffSchema validates path id as ObjectId and requires name", async () => {
    const validParams = await createSpinoffSchema.params.safeParseAsync({ id: validObjectId });
    assert.strictEqual(validParams.success, true);

    const invalidParams = await createSpinoffSchema.params.safeParseAsync({ id: invalidObjectId });
    assert.strictEqual(invalidParams.success, false);

    const validBody = await createSpinoffSchema.body.safeParseAsync({ name: "Spinoff One" });
    assert.strictEqual(validBody.success, true);
  });

  await t.test("createCrossoverSchema requires franchiseId1, franchiseId2 as ObjectIds and crossoverName", async () => {
    const valid = await createCrossoverSchema.body.safeParseAsync({
      franchiseId1: validObjectId,
      franchiseId2: validObjectId,
      crossoverName: "Clash of Heroes",
    });
    assert.strictEqual(valid.success, true);

    const invalid = await createCrossoverSchema.body.safeParseAsync({
      franchiseId1: invalidObjectId,
      franchiseId2: validObjectId,
      crossoverName: "Clash",
    });
    assert.strictEqual(invalid.success, false);
  });

  await t.test("issueBondSchema requires positive faceValue and tenorWeeks", async () => {
    const valid = await issueBondSchema.body.safeParseAsync({ faceValue: 10000000, tenorWeeks: 52 });
    assert.strictEqual(valid.success, true);

    const invalid = await issueBondSchema.body.safeParseAsync({ faceValue: -1000, tenorWeeks: 0 });
    assert.strictEqual(invalid.success, false);
  });

  await t.test("startAwardsCampaignSchema validates movieId as ObjectId", async () => {
    const valid = await startAwardsCampaignSchema.body.safeParseAsync({
      movieId: validObjectId,
      campaignTier: "PRESTIGE_PUSH",
    });
    assert.strictEqual(valid.success, true);

    const invalid = await startAwardsCampaignSchema.body.safeParseAsync({
      movieId: invalidObjectId,
      campaignTier: "PRESTIGE_PUSH",
    });
    assert.strictEqual(invalid.success, false);
  });

  await t.test("testScreeningSchema and orderReshootsSchema validate path id as ObjectId", async () => {
    const validScreening = await testScreeningSchema.params.safeParseAsync({ id: validObjectId });
    assert.strictEqual(validScreening.success, true);

    const invalidScreening = await testScreeningSchema.params.safeParseAsync({ id: invalidObjectId });
    assert.strictEqual(invalidScreening.success, false);

    const validReshoots = await orderReshootsSchema.params.safeParseAsync({ id: validObjectId });
    assert.strictEqual(validReshoots.success, true);
  });

  await t.test("streaming auction schemas validate ObjectId in params and body", async () => {
    const validAuction = await createAuctionSchema.body.safeParseAsync({
      movieId: validObjectId,
      reservePrice: 5000000,
    });
    assert.strictEqual(validAuction.success, true);

    const validBid = await executeAuctionBidSchema.params.safeParseAsync({ auctionId: validObjectId });
    assert.strictEqual(validBid.success, true);

    const invalidBid = await executeAuctionBidSchema.params.safeParseAsync({ auctionId: invalidObjectId });
    assert.strictEqual(invalidBid.success, false);
  });

  await t.test("merchandiseValuationSchema and merchandiseDealSchema enforce distinct requirements", async () => {
    // Valuation requires movieId but category can be optional
    const valWithoutCat = await merchandiseValuationSchema.body.safeParseAsync({ movieId: validObjectId });
    assert.strictEqual(valWithoutCat.success, true);

    // Deal requires category
    const dealWithoutCat = await merchandiseDealSchema.body.safeParseAsync({ movieId: validObjectId });
    assert.strictEqual(dealWithoutCat.success, false);

    const dealWithCat = await merchandiseDealSchema.body.safeParseAsync({
      movieId: validObjectId,
      category: "ACTION_FIGURES",
    });
    assert.strictEqual(dealWithCat.success, true);
  });

  await t.test("notificationIdParamSchema validates path param as ObjectId", async () => {
    const valid = await notificationIdParamSchema.params.safeParseAsync({ id: validObjectId });
    assert.strictEqual(valid.success, true);

    const invalid = await notificationIdParamSchema.params.safeParseAsync({ id: "123" });
    assert.strictEqual(invalid.success, false);
  });

  await t.test("simulateWeekSchema validates weeks range and string numbers", async () => {
    assert.strictEqual((await simulateWeekSchema.body.safeParseAsync({ weeks: 1 })).success, true);
    assert.strictEqual((await simulateWeekSchema.body.safeParseAsync({ weeks: "4" })).success, true);
    assert.strictEqual((await simulateWeekSchema.body.safeParseAsync({ weeks: 53 })).success, false);
    assert.strictEqual((await simulateWeekSchema.body.safeParseAsync({ weeks: 0 })).success, false);
  });
});

test("Express validation middleware integration", async (t) => {
  const validObjectId = "507f1f77bcf86cd799439011";
  const invalidObjectId = "not-an-objectid";

  await t.test("middleware parses valid payload and invokes next() without error", async () => {
    const middleware = validate(updateFanClubBudgetSchema);
    const req = { body: { weeklyBudget: 25000 } };
    const res = {};
    let nextCalled = false;
    let nextError = null;

    await middleware(req, res, (err) => {
      nextCalled = true;
      nextError = err;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(nextError, undefined);
    assert.strictEqual(req.body.weeklyBudget, 25000);
  });

  await t.test("middleware forwards ZodError to next() on invalid input", async () => {
    const middleware = validate(updateFanClubBudgetSchema);
    const req = { body: { weeklyBudget: -100 } };
    const res = {};
    let nextError = null;

    await middleware(req, res, (err) => {
      nextError = err;
    });

    assert.ok(nextError instanceof z.ZodError);
    assert.strictEqual(nextError.issues[0].path[0], "weeklyBudget");
  });

  await t.test("middleware rejects malformed ObjectId path parameter and forwards ZodError", async () => {
    const middleware = validate(notificationIdParamSchema);
    const req = { params: { id: invalidObjectId } };
    const res = {};
    let nextError = null;

    await middleware(req, res, (err) => {
      nextError = err;
    });

    assert.ok(nextError instanceof z.ZodError);
    assert.strictEqual(nextError.issues[0].path[0], "id");
  });

  await t.test("middleware accepts valid ObjectId in params and body simultaneously", async () => {
    const middleware = validate(createSpinoffSchema);
    const req = {
      params: { id: validObjectId },
      body: { name: "A New Spin" },
    };
    const res = {};
    let nextError = null;

    await middleware(req, res, (err) => {
      nextError = err;
    });

    assert.strictEqual(nextError, undefined);
    assert.strictEqual(req.params.id, validObjectId);
    assert.strictEqual(req.body.name, "A New Spin");
  });
});
