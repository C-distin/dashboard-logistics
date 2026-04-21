import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getClients } from "@/app/actions/clients";
import { getPriceRates } from "@/app/actions/price-rates";
import { getShipments } from "@/app/actions/shipments";
import { ShipmentsTable } from "@/components/shipments/shipments-table";
import { auth } from "@/lib/auth/auth";

export default async function AirShipmentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const [allShipments, clients, priceRates] = await Promise.all([
    getShipments(),
    getClients(),
    getPriceRates({ activeOnly: true, type: "AIR" }),
  ]);

  const shipments = allShipments.filter((s) => s.priceRate?.type === "AIR");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Air Shipments</h1>
        <p className="text-muted-foreground">
          Manage all air freight shipments.
        </p>
      </div>
      <ShipmentsTable
        shipmentType="AIR"
        initialShipments={shipments}
        clients={clients}
        priceRates={priceRates}
        userRole={(session.user.role as "admin" | "user") ?? "user"}
      />
    </div>
  );
}
