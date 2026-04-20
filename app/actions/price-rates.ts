"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { exchangeRates, priceRates } from "@/lib/db/schema";
import {
  type PriceRateInput,
  priceRateSchema,
} from "@/lib/validation/price-rates";

// ---------------------------------------------
// GET PRICE RATES
// ---------------------------------------------
export async function getPriceRates(filters?: {
  activeOnly?: boolean;
  type?: "AIR" | "SEA";
}) {
  const conditions = [];

  if (filters?.activeOnly) {
    conditions.push(eq(priceRates.isActive, true));
  }

  if (filters?.type) {
    conditions.push(eq(priceRates.type, filters.type));
  }

  // Join with exchangeRates to potentially return rate names?
  // For now, we just return the price rates as per schema.
  // We can use relational queries if you have them set up,
  // otherwise a simple select works.

  return await db
    .select()
    .from(priceRates)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(priceRates.effectiveFrom));
}

// Helper to verify admin status
async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required.");
  }

  return session;
}

// ---------------------------------------------
// CREATE PRICE RATE
// ---------------------------------------------
export async function createPriceRate(input: PriceRateInput) {
  await verifyAdmin();
  const validatedData = priceRateSchema.parse(input);

  // Optional: Verify that the exchange rate IDs actually exist
  const [ghsRate] = await db
    .select()
    .from(exchangeRates)
    .where(eq(exchangeRates.id, validatedData.exchangeRateGHSId));

  const [rmbRate] = await db
    .select()
    .from(exchangeRates)
    .where(eq(exchangeRates.id, validatedData.exchangeRateRMBId));

  if (!ghsRate || !rmbRate) {
    throw new Error("Invalid Exchange Rate IDs provided.");
  }

  const [newRate] = await db
    .insert(priceRates)
    .values({
      ...validatedData,
      createdBy: (await verifyAdmin()).user.id,
    })
    .returning();

  revalidatePath("/dashboard/settings");
  return newRate;
}

// ---------------------------------------------
// UPDATE PRICE RATE
// ---------------------------------------------
export async function updatePriceRate(
  id: string,
  input: Partial<PriceRateInput>,
) {
  await verifyAdmin();
  const validatedData = priceRateSchema.partial().parse(input);

  const [updatedRate] = await db
    .update(priceRates)
    .set(validatedData)
    .where(eq(priceRates.id, id))
    .returning();

  revalidatePath("/dashboard/settings");
  return updatedRate;
}

// ---------------------------------------------
// DELETE PRICE RATE
// ---------------------------------------------
export async function deletePriceRate(id: string) {
  await verifyAdmin();

  await db.delete(priceRates).where(eq(priceRates.id, id));

  revalidatePath("/dashboard/settings");
}
