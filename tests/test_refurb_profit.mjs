import assert from "node:assert/strict";
import { calculateRefurbProfit } from "../docs/refurb-profit-core.mjs";

function close(actual, expected, tolerance = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`
  );
}

{
  const r = calculateRefurbProfit({
    askingPrice: 220,
    purchasePrice: 90,
    repairs: 10,
    consumables: 5,
    negotiationPercent: 5,
    sellingFeePercent: 0,
    returnReservePercent: 5,
    annualLicenceCost: 692,
    plannedUnits: 20,
    labourMinutes: 60,
    labourRate: 30
  });

  close(r.expectedSalePrice, 209);
  close(r.partsAndAcquisition, 105);
  close(r.licencePerUnit, 34.6);
  close(r.returnReserve, 10.45);
  close(r.labourCost, 30);
  close(r.cashProfit, 58.95);
  close(r.profitAfterLabour, 28.95);
  assert.equal(r.meetsGrossMarginTarget, true);
}

{
  const r = calculateRefurbProfit({
    askingPrice: 180,
    purchasePrice: 130,
    negotiationPercent: 10,
    returnReservePercent: 5,
    annualLicenceCost: 692,
    plannedUnits: 10,
    labourMinutes: 90,
    labourRate: 30
  });
  assert.ok(r.profitAfterLabour < 0, "thin deal should become negative after labour");
  assert.equal(r.meetsGrossMarginTarget, false);
}

{
  const r = calculateRefurbProfit({
    askingPrice: 200,
    purchasePrice: 100,
    annualLicenceCost: 0,
    plannedUnits: 1,
    labourMinutes: 0,
    labourRate: 30
  });
  assert.equal(r.effectiveHourlyReturn, null);
  close(r.breakEvenAskingPrice, 100);
}

assert.throws(
  () => calculateRefurbProfit({
    askingPrice: 200,
    sellingFeePercent: 60,
    returnReservePercent: 40
  }),
  /less than 100%/
);

assert.throws(
  () => calculateRefurbProfit({
    askingPrice: 200,
    negotiationPercent: 100
  }),
  /less than 100%/
);

console.log("Refurb profit calculator tests passed.");
