import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getBatches } from "@/app/actions/batches";
import { BatchesTable } from "@/app/dashboard/batches/batches-table";
import { auth } from "@/lib/auth/auth";

export default async function BatchesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const batches = await getBatches();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Batches</h1>
        <p className="text-muted-foreground">
          Group shipments into air and sea batches for dispatch.
        </p>
      </div>
      <BatchesTable
        initialBatches={batches}
        userRole={(session.user.role as "admin" | "user") ?? "user"}
      />
    </div>
  );
}
