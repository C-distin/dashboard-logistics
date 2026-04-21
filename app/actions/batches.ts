"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { batches, shipments } from "@/lib/db/schema";
import {
  type BatchInput,
  batchSchema,
  updateBatchSchema,
} from "@/lib/validation/batches";

async function getSession() {
  return await auth.api.getSession({ headers: await headers() });
}

async function generateBatchNumber(type: "AIR" | "SEA"): Promise<string> {
  const prefix = type === "AIR" ? "AIR" : "SEA";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ---------------------------------------------
// GET BATCHES
// ---------------------------------------------
export async function getBatches(filters?: {
  type?: "AIR" | "SEA";
  status?: string;
  search?: string;
}) {
  return await db.query.batches.findMany({
    where: (batches, { and, eq, ilike }) => {
      const conditions = [];
      if (filters?.type) conditions.push(eq(batches.type, filters.type));
      if (filters?.status) conditions.push(eq(batches.status, filters.status));
      if (filters?.search)
        conditions.push(ilike(batches.batchNumber, `%${filters.search}%`));
      return conditions.length > 0 ? and(...conditions) : undefined;
    },
    orderBy: (batches, { desc }) => [desc(batches.createdAt)],
    with: {
      shipments: {
        with: { client: true, priceRate: true },
      },
    },
    limit: 100,
  });
}

// ---------------------------------------------
// GET UNASSIGNED SHIPMENTS (for assigning to batch)
// ---------------------------------------------
export async function getUnassignedShipments(type: "AIR" | "SEA") {
  return await db.query.shipments
    .findMany({
      where: (shipments, { isNull, eq, and }) => and(isNull(shipments.batchId)),
      with: { client: true, priceRate: true },
      orderBy: (shipments, { desc }) => [desc(shipments.createdAt)],
    })
    .then((results) => results.filter((s) => s.priceRate?.type === type));
}

// ---------------------------------------------
// ASSIGN SHIPMENTS TO BATCH
// ---------------------------------------------
export async function assignShipmentsToBatch(
  batchId: string,
  shipmentIds: string[],
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await Promise.all(
    shipmentIds.map((id) =>
      db
        .update(shipments)
        .set({ batchId, status: "BATCHED" })
        .where(eq(shipments.id, id)),
    ),
  );

  revalidatePath("/dashboard/batches");
  revalidatePath("/dashboard/air-shipments");
  revalidatePath("/dashboard/sea-shipments");
}

// ---------------------------------------------
// REMOVE SHIPMENT FROM BATCH
// ---------------------------------------------
export async function removeShipmentFromBatch(shipmentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(shipments)
    .set({ batchId: null, status: "RECEIVED_AT_WAREHOUSE" })
    .where(eq(shipments.id, shipmentId));

  revalidatePath("/dashboard/batches");
  revalidatePath("/dashboard/air-shipments");
  revalidatePath("/dashboard/sea-shipments");
}

// ---------------------------------------------
// CREATE BATCH
// ---------------------------------------------
export async function createBatch(input: BatchInput) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = batchSchema.parse(input);

  let batchNumber = data.batchNumber;
  if (!batchNumber) {
    batchNumber = await generateBatchNumber(data.type);
  } else {
    const [existing] = await db
      .select({ id: batches.id })
      .from(batches)
      .where(eq(batches.batchNumber, batchNumber));
    if (existing) throw new Error("Batch number already exists");
  }

  const [newBatch] = await db
    .insert(batches)
    .values({
      batchNumber,
      type: data.type,
      status: data.status,
      containerSize: data.containerSize,
      estimatedDeparture: data.estimatedDeparture ?? null,
      estimatedArrival: data.estimatedArrival ?? null,
      notes: data.notes,
      createdBy: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard/batches");
  return newBatch;
}

// ---------------------------------------------
// UPDATE BATCH
// ---------------------------------------------
export async function updateBatch(id: string, input: Partial<BatchInput>) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = updateBatchSchema.parse(input);

  if (data.batchNumber) {
    const [existing] = await db
      .select({ id: batches.id })
      .from(batches)
      .where(
        and(eq(batches.batchNumber, data.batchNumber), ne(batches.id, id)),
      );
    if (existing) throw new Error("Batch number already exists");
  }

  const [updated] = await db
    .update(batches)
    .set(data)
    .where(eq(batches.id, id))
    .returning();

  revalidatePath("/dashboard/batches");
  return updated;
}

// ---------------------------------------------
// DELETE BATCH
// ---------------------------------------------
export async function deleteBatch(id: string) {
  const session = await getSession();
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");

  const linked = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(eq(shipments.batchId, id))
    .limit(1);

  if (linked.length > 0) {
    throw new Error(
      "Cannot delete: shipments are assigned to this batch. Remove them first.",
    );
  }

  await db.delete(batches).where(eq(batches.id, id));
  revalidatePath("/dashboard/batches");
}
