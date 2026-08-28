import { z } from "zod";
import { CINEMA_MARKET_IDS } from "../constants/cinemaMarkets.js";
import { objectIdString } from "./gameplayValidators.js";

const marketIdEnum = z.enum(Object.values(CINEMA_MARKET_IDS));

export const setMovieTargetMarketsSchema = {
  params: z.object({
    movieId: objectIdString,
  }),
  body: z.object({
    targetMarkets: z.array(marketIdEnum).min(1).max(6),
    primaryMarket: marketIdEnum,
    crossMarketRelease: z.boolean().optional(),
    isCoProduction: z.boolean().optional(),
  }),
};

export const projectMarketRevenueSchema = {
  params: z.object({
    movieId: objectIdString,
  }),
};
