import "./helpers/testEnv.js";

import test from "node:test";
import assert from "node:assert";
import {
  updateFanClubBudgetSchema,
  launchPRCampaignSchema,
  buyUpgradeSchema,
  createCinematicUniverseSchema,
} from "../src/validators/gameplayValidators.js";

test("Zod validation schemas for mutation routes", async (t) => {
  await t.test("updateFanClubBudgetSchema accepts valid non-negative budgets and rejects negative ones", async () => {
    const valid = await updateFanClubBudgetSchema.body.safeParseAsync({ weeklyBudget: 50000 });
    assert.strictEqual(valid.success, true);

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
});
