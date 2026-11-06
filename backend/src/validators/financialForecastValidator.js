import { z } from "zod";

export const financialForecastQuerySchema = {
  query: z.object({
    weeks: z.coerce.number().int().min(1).max(12).optional().default(4),
    lowBalanceThreshold: z.coerce.number().min(0).optional().default(0),
    oneTimeExpense: z.coerce.number().min(0).optional().default(0),
    weeklyExpense: z.coerce.number().min(0).optional().default(0),
    scenarioWeeks: z.coerce.number().int().min(1).max(12).optional(),
  }),
};

export default financialForecastQuerySchema;
