import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getClients } from "@/app/actions/clients";
import { getPriceRates } from "@/app/actions/price-rates";
import { getShipments } from "@/app/actions/shipments";
import { ShipmentsTable } from "@/components/shipments/shipments-table";
import { auth } from "@/lib/auth/auth";

export default async function SeaShipmentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const [allShipments, clients, priceRates] = await Promise.all([
    getShipments(),
    getClients(),
    getPriceRates({ activeOnly: true, type: "SEA" }),
  ]);

  const shipments = allShipments.filter((s) => s.priceRate?.type === "SEA");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sea Shipments</h1>
        <p className="text-muted-foreground">
          Manage all sea freight shipments.
        </p>
      </div>
      <ShipmentsTable
        shipmentType="SEA"
        initialShipments={shipments}
        clients={clients}
        priceRates={priceRates}
        userRole={(session.user.role as "admin" | "user") ?? "user"}
      />
    </div>
  );
}
