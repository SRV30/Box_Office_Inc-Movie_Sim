import { z } from "zod";

const VALID_CAMPAIGN_IDS = [
  "trailer", "teaser", "pr", "tv", "newspaper", "digital", "social", "influencer", "billboards"
];

const VALID_SOUNDTRACK_TIERS = ["PUBLIC_DOMAIN", "INDIE", "PREMIUM"];

// In-game talent/scripts/crew entities use UUIDs, string IDs, or MongoDB ObjectIds
const idPattern = /^(?:[0-9a-fA-F]{24}|[0-9a-fA-F-]{36}|[a-zA-Z0-9_-]+)$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

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
  franchiseId: z.string().regex(objectIdRegex, "Invalid Franchise ID format").optional().or(z.literal("")),
  createFranchise: z.boolean().optional(),
  franchiseName: z.string().trim().max(50, "Franchise name must not exceed 50 characters").optional().or(z.literal("")),

  // Soundtrack tier & Co-Production options (Issue #741)
  soundtrackTier: z.enum(["PUBLIC_DOMAIN", "INDIE", "PREMIUM"]).optional(),
  coProducerStudioId: z.string().regex(objectIdRegex, "Invalid Co-producer Studio ID format").optional().nullable().or(z.literal("")),
  coProducerShare: z.coerce.number().min(0, "Co-producer share must be at least 0%").max(50, "Co-producer share must not exceed 50%").optional(),
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
