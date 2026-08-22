import { z } from "zod";

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
    universeId: z.string().min(1, "Universe ID is required"),
    movieId: z.string().min(1, "Movie ID is required"),
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
    id: z.string().min(1, "Franchise ID is required"),
  }),
  body: z.object({
    name: z.string().min(1, "Spin-off name is required"),
    targetAudience: z.string().optional(),
    budget: z.number().positive().optional(),
  }).passthrough(),
};

export const createCrossoverSchema = {
  body: z.object({
    franchiseId1: z.string().min(1, "First franchise ID is required"),
    franchiseId2: z.string().min(1, "Second franchise ID is required"),
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
    movieId: z.string().min(1, "Movie ID is required"),
    campaignTier: z.string().min(1, "Campaign tier is required"),
  }).passthrough(),
};

export const testScreeningSchema = {
  params: z.object({
    id: z.string().min(1, "Movie ID is required"),
  }),
  body: z.object({
    focusGroupSize: z.number().int().positive().optional(),
  }).passthrough(),
};

export const orderReshootsSchema = {
  params: z.object({
    id: z.string().min(1, "Movie ID is required"),
  }),
  body: z.object({
    reshootBudget: z.number().positive().optional(),
  }).passthrough(),
};

export const createAuctionSchema = {
  body: z.object({
    movieId: z.string().min(1, "Movie ID is required"),
    reservePrice: z.number().positive().optional(),
  }).passthrough(),
};

export const executeAuctionBidSchema = {
  params: z.object({
    auctionId: z.string().min(1, "Auction ID is required"),
  }),
  body: z.object({
    platformId: z.string().optional(),
    bidAmount: z.number().positive().optional(),
  }).passthrough(),
};

export const merchandiseDealSchema = {
  body: z.object({
    movieId: z.string().min(1, "Movie ID is required"),
    dealType: z.string().optional(),
  }).passthrough(),
};

export const notificationIdParamSchema = {
  params: z.object({
    id: z.string().min(1, "Notification ID is required"),
  }),
};
