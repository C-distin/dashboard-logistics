import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getExchangeRates } from "@/app/actions/exchange-rates";
import { auth } from "@/lib/auth/auth";
import { ExchangeRatesTable } from "./exchange-rates-table";

export default async function ExchangeRatesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const rates = await getExchangeRates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exchange Rates</h1>
        <p className="text-muted-foreground">
          Manage currency exchange rates used across the platform.
        </p>
      </div>
      <ExchangeRatesTable initialRates={rates} />
    </div>
  );
}
