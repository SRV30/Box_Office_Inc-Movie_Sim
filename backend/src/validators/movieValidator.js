import { z } from "zod";

const VALID_CAMPAIGN_IDS = [
  "trailer", "teaser", "pr", "tv", "newspaper", "digital", "social", "influencer", "billboards"
];

// In-game talent/scripts/crew entities use UUIDs, string IDs, or MongoDB ObjectIds
const idPattern = /^(?:[0-9a-fA-F]{24}|[0-9a-fA-F-]{36}|[a-zA-Z0-9_-]+)$/;

export const createMovieSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must not exceed 100 characters"),
  scriptId: z.string().trim().min(1, "Script ID is required").regex(idPattern, "Invalid Script ID format"),
  directorId: z.string().trim().min(1, "Director ID is required").regex(idPattern, "Invalid Director ID format"),
  leadActorId: z.string().trim().min(1, "Lead Actor ID is required").regex(idPattern, "Invalid Lead Actor ID format"),
  supportingActorIds: z.array(z.string().trim().min(1).regex(idPattern, "Invalid Supporting Actor ID format")).optional(),
  crewTeamId: z.string().trim().min(1, "Crew Team ID is required").regex(idPattern, "Invalid Crew Team ID format"),
  marketingCampaignIds: z.array(z.string()).optional().refine(
    (ids) => !ids || ids.every((id) => VALID_CAMPAIGN_IDS.includes(id)),
    { message: `Each marketing campaign ID must be one of: ${VALID_CAMPAIGN_IDS.join(", ")}` }
  ),
  franchiseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Franchise ID format").optional().or(z.literal("")),
  createFranchise: z.boolean().optional(),
  franchiseName: z.string().trim().max(50, "Franchise name must not exceed 50 characters").optional().or(z.literal("")),
});

// Exporting the structural pieces cleanly
export const releaseMovieParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Movie ID format"),
});

export const addMarketingCampaignSchema = {
  body: z.object({
    campaignId: z.string().trim().min(1, "Campaign ID is required"),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Movie ID format"),
  }),
};
