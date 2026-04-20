import { getExchangeRates } from "@/app/actions/exchange-rates";
import { ExchangeRatesTable } from "./exchange-rates-table";

export default async function ExchangeRatesPage() {
  const rates = await getExchangeRates();
  return <ExchangeRatesTable initialRates={rates} />;
}
