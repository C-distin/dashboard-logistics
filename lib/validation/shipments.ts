import { z } from "zod";

const SHIPMENT_STATUSES = [
  "RECEIVED_AT_WAREHOUSE",
  "BATCHED",
  "IN_TRANSIT",
  "ARRIVED_AT_PORT",
  "AVAILABLE_FOR_PICKUP",
  "PICKED_UP",
  "DELIVERED",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const shipmentSchema = z.object({
  trackingNumber: z.string().min(1, "Tracking number is required"),
  itemNumber: z.string().optional(),
  clientId: z.uuid("Invalid Client ID"),
  batchId: z.uuid("Invalid Batch ID").optional().nullable(),
  priceRateId: z.uuid("Invalid Price Rate ID"),
  packages: z
    .string()
    .min(1, "Packages is required")
    .regex(/^\d+(\.\d+)?$/, "Must be a number"),
  weight: z
    .string()
    .min(1, "Weight is required")
    .regex(/^\d+(\.\d+)?$/, "Must be a number"),
  cbm: z
    .string()
    .min(1, "CBM is required")
    .regex(/^\d+(\.\d+)?$/, "Must be a number"),
  estimatedArrival: z.date().optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(SHIPMENT_STATUSES),
});

export const updateShipmentSchema = shipmentSchema.partial();

export type ShipmentInput = z.infer<typeof shipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
