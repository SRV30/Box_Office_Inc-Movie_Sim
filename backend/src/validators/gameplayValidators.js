import { z } from "zod";

export const objectIdString = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid 24-character hexadecimal ObjectId");

export const updateFanClubBudgetSchema = {
  body: z.object({
    weeklyBudget: z.number().min(0, "Weekly budget must be a non-negative number"),
  }),
};

export const launchPRCampaignSchema = {
  body: z.object({
    campaignId: z.string().min(1, "Campaign ID is required"),
  }),
};

export const createCinematicUniverseSchema = {
  body: z.object({
    universeName: z.string().min(1, "Universe name is required"),
  }),
};

export const addMovieToUniverseSchema = {
  body: z.object({
    universeId: objectIdString,
    movieId: objectIdString,
  }),
};

export const buyUpgradeSchema = {
  body: z.object({
    upgradeId: z.string().min(1, "Upgrade ID is required"),
  }),
};

export const simulateWeekSchema = {
  body: z.object({
    weeks: z.union([z.number().int().min(1).max(52), z.string().regex(/^\d+$/)]).optional(),
  }),
};

export const createSpinoffSchema = {
  params: z.object({
    id: objectIdString,
  }),
  body: z.object({
    name: z.string().min(1, "Spin-off name is required"),
    targetAudience: z.string().optional(),
    budget: z.number().positive().optional(),
  }).passthrough(),
};

export const createCrossoverSchema = {
  body: z.object({
    franchiseId1: objectIdString,
    franchiseId2: objectIdString,
    crossoverName: z.string().min(1, "Crossover name is required"),
  }).passthrough(),
};

export const issueBondSchema = {
  body: z.object({
    faceValue: z.number().positive("Face value must be positive"),
    tenorWeeks: z.number().int().positive("Tenor weeks must be positive"),
  }).passthrough(),
};

export const startAwardsCampaignSchema = {
  body: z.object({
    movieId: objectIdString,
    campaignTier: z.string().min(1, "Campaign tier is required"),
  }).passthrough(),
};

export const testScreeningSchema = {
  params: z.object({
    id: objectIdString,
  }),
  body: z.object({
    focusGroupSize: z.number().int().positive().optional(),
  }).passthrough(),
};

export const orderReshootsSchema = {
  params: z.object({
    id: objectIdString,
  }),
  body: z.object({
    reshootBudget: z.number().positive().optional(),
  }).passthrough(),
};

export const createAuctionSchema = {
  body: z.object({
    movieId: objectIdString,
    reservePrice: z.number().positive().optional(),
  }).passthrough(),
};

export const executeAuctionBidSchema = {
  params: z.object({
    auctionId: objectIdString,
  }),
  body: z.object({
    platformId: z.string().optional(),
    bidAmount: z.number().positive().optional(),
  }).passthrough(),
};

export const merchandiseValuationSchema = {
  body: z.object({
    movieId: objectIdString,
    category: z.string().optional(),
    tier: z.string().optional(),
  }).passthrough(),
};

export const merchandiseDealSchema = {
  body: z.object({
    movieId: objectIdString,
    category: z.string().min(1, "Category is required"),
    tier: z.string().optional(),
  }).passthrough(),
};

export const notificationIdParamSchema = {
  params: z.object({
    id: objectIdString,
  }),
};
