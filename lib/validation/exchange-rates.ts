import { z } from "zod";

export const exchangeRateSchema = z.object({
  fromCurrency: z.enum(["USD", "RMB", "GHS"]),
  toCurrency: z.enum(["USD", "RMB", "GHS"]),
  rate: z
    .string()
    .min(1, "Rate is required")
    .refine((val) => Number(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Rate must be a positive number",
    }),
  effectiveFrom: z.date(),
  effectiveTo: z.date().optional().nullable(),
  isActive: z.boolean(),
});

export type ExchangeRateInput = z.infer<typeof exchangeRateSchema>;
