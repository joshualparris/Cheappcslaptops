export function calculateRefurbProfit(raw = {}) {
  const number = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const nonNegative = (value, fallback = 0) => Math.max(0, number(value, fallback));

  const askingPrice = nonNegative(raw.askingPrice);
  const purchasePrice = nonNegative(raw.purchasePrice);
  const inboundFreight = nonNegative(raw.inboundFreight);
  const ram = nonNegative(raw.ram);
  const ssd = nonNegative(raw.ssd);
  const battery = nonNegative(raw.battery);
  const charger = nonNegative(raw.charger);
  const repairs = nonNegative(raw.repairs);
  const consumables = nonNegative(raw.consumables);

  const sellingFeeRate = nonNegative(raw.sellingFeePercent) / 100;
  const negotiationRate = nonNegative(raw.negotiationPercent) / 100;
  const returnReserveRate = nonNegative(raw.returnReservePercent) / 100;

  const annualLicenceCost = nonNegative(raw.annualLicenceCost);
  const plannedUnits = Math.max(1, Math.round(nonNegative(raw.plannedUnits, 1)));
  const labourMinutes = nonNegative(raw.labourMinutes);
  const labourRate = nonNegative(raw.labourRate);

  if (sellingFeeRate + returnReserveRate >= 1) {
    throw new Error("Selling fee plus return/failure reserve must be less than 100%.");
  }
  if (negotiationRate >= 1) {
    throw new Error("Negotiation allowance must be less than 100%.");
  }

  const partsAndAcquisition =
    purchasePrice +
    inboundFreight +
    ram +
    ssd +
    battery +
    charger +
    repairs +
    consumables;

  const expectedSalePrice = askingPrice * (1 - negotiationRate);
  const sellingFees = expectedSalePrice * sellingFeeRate;
  const returnReserve = expectedSalePrice * returnReserveRate;
  const licencePerUnit = annualLicenceCost / plannedUnits;
  const labourHours = labourMinutes / 60;
  const labourCost = labourHours * labourRate;

  const grossBeforeOverhead = expectedSalePrice - partsAndAcquisition;
  const cashCost =
    partsAndAcquisition +
    licencePerUnit +
    sellingFees +
    returnReserve;
  const cashProfit = expectedSalePrice - cashCost;
  const economicCost = cashCost + labourCost;
  const profitAfterLabour = expectedSalePrice - economicCost;
  const effectiveHourlyReturn =
    labourHours > 0 ? cashProfit / labourHours : null;

  const retainedSaleRate =
    (1 - negotiationRate) *
    (1 - sellingFeeRate - returnReserveRate);
  const fixedEconomicCost = partsAndAcquisition + licencePerUnit + labourCost;
  const breakEvenAskingPrice =
    retainedSaleRate > 0 ? fixedEconomicCost / retainedSaleRate : null;

  return {
    askingPrice,
    expectedSalePrice,
    partsAndAcquisition,
    licencePerUnit,
    sellingFees,
    returnReserve,
    labourCost,
    cashCost,
    economicCost,
    grossBeforeOverhead,
    cashProfit,
    profitAfterLabour,
    effectiveHourlyReturn,
    breakEvenAskingPrice,
    plannedUnits,
    labourHours,
    meetsGrossMarginTarget: grossBeforeOverhead >= 80,
  };
}
