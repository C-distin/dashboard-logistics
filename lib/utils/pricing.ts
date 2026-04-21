export type PriceRateForCalc = {
  pricePerKgUSD: string | number;
  pricePerCbmUSD: string | number;
  minimumChargeUSD: string | number;
};

export type ShippingCostBreakdown = {
  weightCharge: number;
  cbmCharge: number;
  totalCharge: number;
  chargeSource: "WEIGHT" | "CBM" | "MINIMUM";
};

export function calculateShippingCost(
  rate: PriceRateForCalc,
  dimensions: { weight?: number | string | null; cbm?: number | string | null },
): ShippingCostBreakdown {
  const weight = Number(dimensions.weight ?? 0);
  const cbm = Number(dimensions.cbm ?? 0);
  const pricePerKg = Number(rate.pricePerKgUSD);
  const pricePerCbm = Number(rate.pricePerCbmUSD);
  const minimumCharge = Number(rate.minimumChargeUSD);

  const weightCharge = weight * pricePerKg;
  const cbmCharge = cbm * pricePerCbm;

  let primaryCharge = Math.max(weightCharge, cbmCharge);
  let chargeSource: "WEIGHT" | "CBM" | "MINIMUM" =
    weightCharge >= cbmCharge ? "WEIGHT" : "CBM";

  if (primaryCharge < minimumCharge) {
    primaryCharge = minimumCharge;
    chargeSource = "MINIMUM";
  }

  return {
    weightCharge: parseFloat(weightCharge.toFixed(2)),
    cbmCharge: parseFloat(cbmCharge.toFixed(2)),
    totalCharge: parseFloat(primaryCharge.toFixed(2)),
    chargeSource,
  };
}
