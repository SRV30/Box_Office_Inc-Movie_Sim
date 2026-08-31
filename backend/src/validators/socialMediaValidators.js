import { z } from "zod";
import { SOCIAL_PLATFORMS } from "../constants/socialPlatforms.js";
import { objectIdString } from "./gameplayValidators.js";

export const updateSocialBudgetSchema = {
  body: z.object({
    weeklyBudget: z.number().min(0, "Weekly budget must be a non-negative number"),
  }),
};

export const launchSocialCampaignSchema = {
  body: z.object({
    platform: z.enum(Object.values(SOCIAL_PLATFORMS)),
    movieId: objectIdString,
    campaignType: z.string().min(1, "Campaign type is required"),
  }),
};
