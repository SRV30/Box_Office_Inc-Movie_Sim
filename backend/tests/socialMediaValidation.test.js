import { describe, it } from "node:test";
import assert from "node:assert";
import {
  updateSocialBudgetSchema,
  launchSocialCampaignSchema,
} from "../src/validators/socialMediaValidators.js";
import { SOCIAL_PLATFORMS } from "../src/constants/socialPlatforms.js";

describe("Social Media Route & Request Validation Tests", () => {
  it("accepts valid platforms in updateSocialBudgetSchema params", async () => {
    for (const platform of Object.values(SOCIAL_PLATFORMS)) {
      const parsed = await updateSocialBudgetSchema.params.parseAsync({ platform });
      assert.strictEqual(parsed.platform, platform);
    }
  });

  it("rejects unknown or invalid platforms in updateSocialBudgetSchema params", async () => {
    const invalidPlatforms = ["myspace", "facebook", "random_platform", ""];
    for (const platform of invalidPlatforms) {
      await assert.rejects(
        async () => {
          await updateSocialBudgetSchema.params.parseAsync({ platform });
        },
        (err) => {
          assert.strictEqual(err.name, "ZodError");
          return true;
        }
      );
    }
  });

  it("validates weeklyBudget body field constraints", async () => {
    const valid = await updateSocialBudgetSchema.body.parseAsync({ weeklyBudget: 5000 });
    assert.strictEqual(valid.weeklyBudget, 5000);

    const zeroBudget = await updateSocialBudgetSchema.body.parseAsync({ weeklyBudget: 0 });
    assert.strictEqual(zeroBudget.weeklyBudget, 0);

    await assert.rejects(async () => {
      await updateSocialBudgetSchema.body.parseAsync({ weeklyBudget: -500 });
    });
  });

  it("validates launchSocialCampaignSchema platform enum and campaign constraints", async () => {
    const validBody = {
      platform: SOCIAL_PLATFORMS.TIKTOK,
      movieId: "507f1f77bcf86cd799439011",
      campaignType: "VIRAL_TRAILER",
    };
    const parsed = await launchSocialCampaignSchema.body.parseAsync(validBody);
    assert.strictEqual(parsed.platform, SOCIAL_PLATFORMS.TIKTOK);

    await assert.rejects(async () => {
      await launchSocialCampaignSchema.body.parseAsync({
        ...validBody,
        platform: "unsupported_platform",
      });
    });

    await assert.rejects(async () => {
      await launchSocialCampaignSchema.body.parseAsync({
        ...validBody,
        movieId: "not-a-valid-object-id",
      });
    });
  });
});
