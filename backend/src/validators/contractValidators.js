/**
 * @fileoverview Contract Route Validation Schemas using Zod
 */

import { z } from "zod";

export const validateContractNegotiationSchema = {
  body: z.object({
    talentId: z.string().min(1, "talentId is required"),
    talentType: z.enum(["ACTOR", "DIRECTOR", "WRITER"]),
    offer: z.object({
      baseSalary: z.number().min(0, "baseSalary must be a non-negative number"),
      backendPoints: z.number().min(0).max(25).optional(),
      movieCount: z.number().min(1).max(10).optional(),
    }),
  }),
};

export const validateContractBuyoutSchema = {
  body: z.object({
    contractId: z.string().min(1, "contractId is required"),
  }),
};

export const validateContractRenegotiationSchema = {
  body: z.object({
    contractId: z.string().min(1, "contractId is required"),
    newOffer: z.object({
      baseSalary: z.number().min(0, "baseSalary must be a non-negative number").optional(),
      backendPoints: z.number().min(0).max(25).optional(),
      movieCount: z.number().min(1).max(10).optional(),
    }),
  }),
};
