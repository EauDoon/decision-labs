import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, evaluateOffer, unitsToNextTier, validateScenario } from "../src/model.js";

function gapFixture(buyers, offerOverrides = {}) {
  const source = clonePreset("tiers");
  return validateScenario({
    title: "Next-tier gap fixture",
    currency: "AUD",
    buyers: buyers.map((buyer, index) => ({
      id: `B${String(index + 1).padStart(2, "0")}`,
      label: buyer.label,
      category: "Coffee beans",
      quantity: buyer.quantity,
      maxUnitPrice: buyer.maxUnitPrice,
      latestDeliveryDays: 7,
      allowedVariants: ["Medium roast"]
    })),
    offers: [{
      ...source.offers[0],
      id: "O01",
      merchant: "Common Roast",
      category: "Coffee beans",
      variant: "Medium roast",
      unitPrice: 28,
      minimumUnits: 4,
      deliveryDays: 5,
      capacity: 20,
      shippingPerBuyer: 0,
      tiers: [{ minimumUnits: 14, unitPrice: 20 }],
      ...offerOverrides
    }]
  });
}

test("units to next tier names excluded buyers who could supply additional whole units", () => {
  const scenario = gapFixture([
    { label: "Core group", quantity: 8, maxUnitPrice: 30 },
    { label: "Discount-only group", quantity: 4, maxUnitPrice: 20 }
  ]);
  const result = evaluateOffer(scenario, "O01");
  assert.equal(result.qualifies, true);
  assert.equal(result.activeTierIndex, 0);
  assert.equal(result.fulfilledUnits, 8);

  const gap = unitsToNextTier(scenario, "O01");
  assert.equal(gap.reachable, false);
  assert.equal(gap.nextMinimum, 14);
  assert.equal(gap.nextPrice, 20);
  assert.equal(gap.unitsNeeded, 2);
  assert.equal(gap.allocatedUnitsAtNext, 12);
  assert.deepEqual(gap.supplierBuyerIds, ["B02"]);
  assert.equal(gap.supplierBuyerCount, 1);
  assert.equal(gap.supplierUnits, 4);
  assert.match(gap.reason, /cannot reach the next cheaper tier/);
});

test("units to next tier reports packing limits when demand fits but whole orders cannot", () => {
  const scenario = gapFixture([
    { label: "Large A", quantity: 9, maxUnitPrice: 30 },
    { label: "Large B", quantity: 9, maxUnitPrice: 20 }
  ], { capacity: 14, tiers: [{ minimumUnits: 14, unitPrice: 20 }] });
  const gap = unitsToNextTier(scenario, "O01");
  assert.equal(gap.compatibleUnitsAtNext, 18);
  assert.equal(gap.allocatedUnitsAtNext, 9);
  assert.equal(gap.unitsNeeded, 5);
  assert.equal(gap.reachable, false);
  assert.match(gap.reason, /cannot pack/);
  assert.deepEqual(gap.supplierBuyerIds, ["B02"]);
});

test("units to next tier is honest when no cheaper band exists", () => {
  const scenario = clonePreset("neighbourhood");
  const gap = unitsToNextTier(scenario, scenario.offers[0].id);
  assert.equal(gap.reachable, false);
  assert.equal(gap.unitsNeeded, null);
  assert.equal(gap.supplierBuyerCount, 0);
  assert.match(gap.reason, /No cheaper quantity tier is declared/);
});

test("units to next tier reports no remaining cheaper band on the selected last tier", () => {
  const scenario = clonePreset("tiers");
  const gap = unitsToNextTier(scenario, "O01");
  assert.equal(gap.currentUnits, 20);
  assert.equal(gap.currentTierIndex, 2);
  assert.equal(gap.nextMinimum, null);
  assert.equal(gap.unitsNeeded, null);
  assert.equal(gap.reachable, false);
  assert.match(gap.reason, /No cheaper quantity tier remains/);
});

test("merchant-safe next-tier fields omit buyer identities", () => {
  const scenario = gapFixture([
    { label: "SECRET_LABEL", quantity: 8, maxUnitPrice: 30 },
    { label: "SECRET_SUPPLIER", quantity: 4, maxUnitPrice: 20 }
  ]);
  const gap = unitsToNextTier(scenario, "O01");
  const merchant = {
    merchant: gap.merchant,
    unitsNeeded: gap.unitsNeeded,
    supplierBuyerCount: gap.supplierBuyerCount,
    supplierUnits: gap.supplierUnits,
    reason: gap.reason
  };
  const json = JSON.stringify(merchant);
  assert.equal(json.includes("SECRET_LABEL"), false);
  assert.equal(json.includes("SECRET_SUPPLIER"), false);
  assert.equal(json.includes("B01"), false);
  assert.equal(json.includes("B02"), false);
});
