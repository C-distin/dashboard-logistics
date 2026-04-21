"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { priceRates, shipments } from "@/lib/db/schema";
import { calculateShippingCost } from "@/lib/utils/pricing";
import {
  type ShipmentInput,
  shipmentSchema,
  type UpdateShipmentInput,
  updateShipmentSchema,
} from "@/lib/validation/shipments";

type ShipmentStatus =
  | "RECEIVED_AT_WAREHOUSE"
  | "BATCHED"
  | "IN_TRANSIT"
  | "ARRIVED_AT_PORT"
  | "AVAILABLE_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED";

async function getSession() {
  return await auth.api.getSession({ headers: await headers() });
}

// ---------------------------------------------
// GET SHIPMENTS
// ---------------------------------------------
export async function getShipments(filters?: {
  search?: string;
  status?: ShipmentStatus;
  clientId?: string;
}) {
  return await db.query.shipments.findMany({
    where: (shipments, { and, eq, ilike }) => {
      const conditions = [];
      if (filters?.status) {
        conditions.push(eq(shipments.status, filters.status));
      }
      if (filters?.clientId) {
        conditions.push(eq(shipments.clientId, filters.clientId));
      }
      if (filters?.search) {
        conditions.push(ilike(shipments.trackingNumber, `%${filters.search}%`));
      }
      return conditions.length > 0 ? and(...conditions) : undefined;
    },
    orderBy: (shipments, { desc }) => [desc(shipments.createdAt)],
    with: {
      client: true,
      batch: true,
      priceRate: true,
    },
    limit: 100,
  });
}

// ---------------------------------------------
// CREATE SHIPMENT
// ---------------------------------------------
export async function createShipment(input: ShipmentInput) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = shipmentSchema.parse(input);

  // Check tracking number uniqueness
  const [existing] = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(eq(shipments.trackingNumber, data.trackingNumber));
  if (existing) throw new Error("Tracking number already exists");

  // Fetch price rate
  const [priceRate] = await db
    .select()
    .from(priceRates)
    .where(eq(priceRates.id, data.priceRateId));
  if (!priceRate) throw new Error("Invalid price rate selected");

  const { totalCharge } = calculateShippingCost(priceRate, {
    weight: data.weight,
    cbm: data.cbm,
  });

  const [newShipment] = await db
    .insert(shipments)
    .values({
      trackingNumber: data.trackingNumber,
      itemNumber: data.itemNumber,
      clientId: data.clientId,
      batchId: data.batchId ?? null,
      priceRateId: data.priceRateId,
      packages: data.packages,
      weight: data.weight,
      cbm: data.cbm,
      estimatedArrival: data.estimatedArrival ?? null,
      notes: data.notes,
      status: data.status,
      totalChargeUSD: totalCharge.toString(),
      createdBy: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard/air-shipments");
  revalidatePath("/dashboard/sea-shipments");
  return newShipment;
}

// ---------------------------------------------
// UPDATE SHIPMENT
// ---------------------------------------------
export async function updateShipment(id: string, input: UpdateShipmentInput) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = updateShipmentSchema.parse(input);

  let totalChargeUSD: string | undefined;

  if (data.weight !== undefined || data.cbm !== undefined || data.priceRateId) {
    const [existing] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));
    if (!existing) throw new Error("Shipment not found");

    const rateId = data.priceRateId ?? existing.priceRateId;
    const [priceRate] = await db
      .select()
      .from(priceRates)
      .where(eq(priceRates.id, rateId));
    if (!priceRate) throw new Error("Invalid price rate");

    const { totalCharge } = calculateShippingCost(priceRate, {
      weight: data.weight ?? existing.weight,
      cbm: data.cbm ?? existing.cbm,
    });
    totalChargeUSD = totalCharge.toString();
  }

  const [updated] = await db
    .update(shipments)
    .set({
      ...data,
      ...(totalChargeUSD ? { totalChargeUSD } : {}),
    })
    .where(eq(shipments.id, id))
    .returning();

  revalidatePath("/dashboard/air-shipments");
  revalidatePath("/dashboard/sea-shipments");
  return updated;
}

// ---------------------------------------------
// DELETE SHIPMENT
// ---------------------------------------------
export async function deleteShipment(id: string) {
  const session = await getSession();
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  try {
    await db.delete(shipments).where(eq(shipments.id, id));
    revalidatePath("/dashboard/air-shipments");
    revalidatePath("/dashboard/sea-shipments");
  } catch {
    throw new Error("Cannot delete shipment. It may have invoices attached.");
  }
}
