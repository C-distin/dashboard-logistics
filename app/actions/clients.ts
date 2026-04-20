"use server";

import { desc, eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { type ClientInput, clientSchema } from "@/lib/validation/clients";

// ---------------------------------------------
// GET CLIENTS (with optional search)
// ---------------------------------------------
export async function getClients(search?: string) {
  return await db
    .select()
    .from(clients)
    .where(search ? ilike(clients.name, `%${search}%`) : undefined)
    .orderBy(desc(clients.name));
}

// ---------------------------------------------
// CREATE CLIENT
// ---------------------------------------------
export async function createClient(input: ClientInput) {
  const validatedData = clientSchema.parse(input);

  const [newClient] = await db
    .insert(clients)
    .values({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phoneNumber, // Mapping happens here
      address: validatedData.address,
    })
    .returning();

  revalidatePath("/dashboard/clients"); // Adjust path as needed

  return newClient;
}

// ---------------------------------------------
// UPDATE CLIENT
// ---------------------------------------------
export async function updateClient(id: string, input: ClientInput) {
  const validatedData = clientSchema.parse(input);

  const [updatedClient] = await db
    .update(clients)
    .set({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phoneNumber, // Mapping
      address: validatedData.address,
      updatedAt: new Date(), // Explicitly update timestamp if $onUpdate isn't working or desired
    })
    .where(eq(clients.id, id))
    .returning();

  revalidatePath("/dashboard/clients");

  return updatedClient;
}

// ---------------------------------------------
// DELETE CLIENT
// ---------------------------------------------
export async function deleteClient(id: string) {
  await db.delete(clients).where(eq(clients.id, id));

  revalidatePath("/dashboard/clients");
}
