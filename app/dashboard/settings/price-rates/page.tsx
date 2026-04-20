import { getExchangeRates } from "@/app/actions/exchange-rates";
import { getPriceRates } from "@/app/actions/price-rates";
import { PriceRatesTable } from "./price-rates-table";

export default async function PriceRatesPage() {
  const [priceRates, exchangeRates] = await Promise.all([
    getPriceRates(),
    getExchangeRates({ activeOnly: true }),
  ]);
  return (
    <PriceRatesTable initialRates={priceRates} exchangeRates={exchangeRates} />
  );
}
