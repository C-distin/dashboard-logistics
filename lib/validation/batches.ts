import { z } from "zod";

export const BATCH_STATUSES = [
  "RECEIVED_AT_WAREHOUSE",
  "BATCHED",
  "IN_TRANSIT",
  "ARRIVED_AT_PORT",
  "AVAILABLE_FOR_PICKUP",
  "PICKED_UP",
  "DELIVERED",
] as const;

export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const batchSchema = z.object({
  batchNumber: z.string().min(1, "Batch number is required").optional(),
  type: z.enum(["AIR", "SEA"]),
  status: z.enum(BATCH_STATUSES),
  containerSize: z.string().optional(),
  estimatedDeparture: z.date().optional().nullable(),
  estimatedArrival: z.date().optional().nullable(),
  notes: z.string().optional(),
});

export const updateBatchSchema = batchSchema.partial();
export type BatchInput = z.infer<typeof batchSchema>;
