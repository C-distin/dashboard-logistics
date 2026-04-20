import { z } from "zod";

export const priceRateSchema = z.object({
  type: z.enum(["AIR", "SEA"]),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),

  // Numeric fields are strings in Drizzle for precision
  pricePerKgUSD: z
    .string()
    .min(1, "Price per KG is required")
    .refine((val) => Number(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Must be a valid positive number",
    }),
  pricePerCbmUSD: z
    .string()
    .min(1, "Price per CBM is required")
    .refine((val) => Number(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Must be a valid positive number",
    }),
  minimumChargeUSD: z
    .string()
    .refine((val) => Number(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Must be a valid positive number",
    }),

  // UUIDs for Exchange Rates
  exchangeRateGHSId: z.uuid("Invalid Exchange Rate ID for GHS"),
  exchangeRateRMBId: z.uuid("Invalid Exchange Rate ID for RMB"),

  // Dates
  effectiveFrom: z.date(),
  effectiveTo: z.date().optional().nullable(),

  // Status
  isActive: z.boolean(),
});

export type PriceRateInput = z.infer<typeof priceRateSchema>;
