/**
 * @fileoverview Box Office API Validation Schemas
 */

import { z } from "zod";

export const validateClashAnalyticsSchema = {
  params: z.object({
    movieId: z.string().min(1, "movieId parameter is required"),
  }),
};

export const validateBoxOfficeAnalyticsSchema = {
  params: z.object({
    movieId: z.string().min(1, "movieId parameter is required"),
  }),
};
