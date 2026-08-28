import { z } from "zod";
import { objectIdString } from "./gameplayValidators.js";

export const submitCounterofferSchema = {
  params: z.object({
    auctionId: objectIdString,
  }),
  body: z.object({
    platformId: z.string().min(1),
    amount: z.number().positive(),
  }),
};
