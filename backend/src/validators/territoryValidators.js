import { z } from "zod";

export const signTerritoryDealSchema = z.object({
  movieId: z.string().min(1, "Movie ID is required"),
  region: z.enum(["EUROPE", "ASIA_PACIFIC", "LATIN_AMERICA", "MIDDLE_EAST_AFRICA"]),
  dealType: z.enum(["MINIMUM_GUARANTEE", "REVENUE_SHARE"]),
});
