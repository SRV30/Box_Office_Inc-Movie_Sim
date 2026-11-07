import { z } from "zod";
import { SOCIAL_PLATFORMS } from "../constants/socialPlatforms.js";
import { objectIdString } from "./gameplayValidators.js";

const platformEnum = z.enum(Object.values(SOCIAL_PLATFORMS), {
  errorMap: () => ({
    message: `Invalid social media platform. Supported platforms: ${Object.values(SOCIAL_PLATFORMS).join(", ")}`,
  }),
});

export const updateSocialBudgetSchema = {
  params: z.object({
    platform: platformEnum,
  }),
  body: z.object({
    weeklyBudget: z.number().min(0, "Weekly budget must be a non-negative number"),
  }),
};

export const launchSocialCampaignSchema = {
  body: z.object({
    platform: platformEnum,
    movieId: objectIdString,
    campaignType: z.string().min(1, "Campaign type is required"),
  }),
};
