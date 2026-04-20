"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth"; // For server-side session check
import { db } from "@/lib/db";
import { exchangeRates } from "@/lib/db/schema";
import {
  type ExchangeRateInput,
  exchangeRateSchema,
} from "@/lib/validation/exchange-rates";

// ---------------------------------------------
// GET EXCHANGE RATES
// ---------------------------------------------
export async function getExchangeRates(filters?: {
  activeOnly?: boolean;
  currency?: "USD" | "RMB" | "GHS";
}) {
  const conditions = [];

  // Filter by active status
  if (filters?.activeOnly) {
    conditions.push(eq(exchangeRates.isActive, true));
  }

  // Filter by target currency
  if (filters?.currency) {
    conditions.push(eq(exchangeRates.toCurrency, filters.currency));
  }

  return await db
    .select()
    .from(exchangeRates)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(exchangeRates.effectiveFrom));
}

// ---------------------------------------------
// CREATE EXCHANGE RATE
// ---------------------------------------------
export async function createExchangeRate(input: ExchangeRateInput) {
  // 1. Authorization Check (Admin Only)
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized: Only admins can create exchange rates.");
  }

  // 2. Validate Input
  const validatedData = exchangeRateSchema.parse(input);

  // 3. Insert into DB
  const [newRate] = await db
    .insert(exchangeRates)
    .values({
      fromCurrency: validatedData.fromCurrency,
      toCurrency: validatedData.toCurrency,
      rate: validatedData.rate, // Drizzle expects string for numeric if defined as string in schema
      effectiveFrom: validatedData.effectiveFrom,
      effectiveTo: validatedData.effectiveTo,
      isActive: validatedData.isActive,
      createdBy: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard/settings"); // Adjust path as needed
  return newRate;
}

// ---------------------------------------------
// UPDATE EXCHANGE RATE
// ---------------------------------------------
export async function updateExchangeRate(
  id: string,
  input: Partial<ExchangeRateInput>,
) {
  // 1. Authorization Check (Admin Only)
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized: Only admins can update exchange rates.");
  }

  // 2. Validate Input (Partial validation for updates)
  const validatedData = exchangeRateSchema.partial().parse(input);

  // 3. Update DB
  const [updatedRate] = await db
    .update(exchangeRates)
    .set({
      ...validatedData,
      // Ensure numeric is string if that's how Drizzle handles it
      rate: validatedData.rate ? validatedData.rate : undefined,
    })
    .where(eq(exchangeRates.id, id))
    .returning();

  revalidatePath("/dashboard/settings");
  return updatedRate;
}

// ---------------------------------------------
// DELETE EXCHANGE RATE
// ---------------------------------------------
export async function deleteExchangeRate(id: string) {
  // 1. Authorization Check (Admin Only)
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized: Only admins can delete exchange rates.");
  }

  await db.delete(exchangeRates).where(eq(exchangeRates.id, id));

  revalidatePath("/dashboard/settings");
}
