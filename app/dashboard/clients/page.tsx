import { ClientsTable } from "@/app/dashboard/clients/clients-table";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">
          Manage your client database and contact information.
        </p>
      </div>

      <ClientsTable />
    </div>
  );
}
