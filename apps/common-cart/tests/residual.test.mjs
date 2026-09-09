import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, computeResidualCoverage, evaluateMarket, validateScenario } from "../src/model.js";

function leftoverFixture() {
  const source = clonePreset("neighbourhood");
  return validateScenario({
    title: "Residual fill fixture",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 }
    ]
  });
}

test("residual coverage fills leftover buyers on a second offer without splitting quantities", () => {
  const scenario = leftoverFixture();
  const market = evaluateMarket(scenario);
  assert.equal(market.winner?.offer.id, "O01");
  assert.deepEqual(market.winner.selectedBuyerIds, ["B01", "B02"]);
  assert.equal(market.winner.fulfilledUnits, 12);

  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.planningAid, true);
  assert.match(coverage.note, /not a dual checkout/i);
  assert.equal(coverage.primary.offerId, "O01");
  assert.equal(coverage.primary.fulfilledUnits, 12);
  assert.equal(coverage.leftoverBuyerCount, 2);
  assert.equal(coverage.leftoverUnits, 9);
  assert.deepEqual(coverage.leftoverBuyerIds, ["B03", "B04"]);
  assert.equal(coverage.secondary.offerId, "O02");
  assert.equal(coverage.secondary.fulfilledUnits, 9);
  assert.deepEqual(coverage.secondary.selectedBuyerIds, ["B03", "B04"]);
  assert.equal(coverage.unfilledBuyerCount, 0);
  assert.equal(coverage.unfilledUnits, 0);
  assert.equal(coverage.primary.fulfilledUnits + coverage.secondary.fulfilledUnits, 21);
});

test("residual coverage never reuses the winning offer or splits a buyer", () => {
  const scenario = leftoverFixture();
  scenario.buyers.push({
    id: "B05",
    label: "Oversized coffee",
    category: "Coffee beans",
    quantity: 21,
    maxUnitPrice: 30,
    latestDeliveryDays: 7,
    allowedVariants: ["Medium roast"]
  });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.primary.offerId, "O01");
  assert.ok(!coverage.primary.selectedBuyerIds);
  assert.ok(coverage.leftoverBuyerIds.includes("B05"));
  assert.equal(coverage.secondary?.offerId, "O02");
  assert.ok(!coverage.leftoverBuyerIds.includes("B01"));
  assert.ok(!coverage.leftoverBuyerIds.includes("B02"));
});

test("residual coverage reports leftover demand when no other offer qualifies", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 40;
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.primary.offerId, "O01");
  assert.equal(coverage.secondary, null);
  assert.equal(coverage.leftoverBuyerCount, 2);
  assert.equal(coverage.unfilledUnits, 9);
});

test("residual coverage is empty when the winner includes every buyer", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers.forEach((buyer) => {
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 40;
    buyer.latestDeliveryDays = 30;
  });
  scenario.offers = [{ ...scenario.offers[0], variant: "Medium roast", minimumUnits: 1, capacity: 5000, deliveryDays: 1 }];
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.primary.offerId, "O01");
  assert.equal(coverage.secondary, null);
  assert.equal(coverage.leftoverBuyerCount, 0);
  assert.equal(coverage.leftoverUnits, 0);
});

test("residual coverage without a winner leaves every buyer unfilled", () => {
  const scenario = leftoverFixture();
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.primary, null);
  assert.equal(coverage.secondary, null);
  assert.equal(coverage.tertiary, null);
  assert.equal(coverage.leftoverBuyerCount, 4);
  assert.equal(coverage.unfilledBuyerCount, 4);
});

function tertiaryFixture() {
  const source = clonePreset("neighbourhood");
  return validateScenario({
    title: "Tertiary fill fixture",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B05", label: "Pantry desk", category: "Pantry box", quantity: 6, maxUnitPrice: 50, latestDeliveryDays: 5, allowedVariants: ["Standard"] },
      { ...source.buyers[0], id: "B06", label: "Pantry hall", category: "Pantry box", quantity: 5, maxUnitPrice: 50, latestDeliveryDays: 5, allowedVariants: ["Standard"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O03", merchant: "Shared Shelf", category: "Pantry box", variant: "Standard", unitPrice: 42, minimumUnits: 8, deliveryDays: 4, capacity: 20, shippingPerBuyer: 1 }
    ]
  });
}

test("tertiary residual fill uses a third distinct offer on remaining whole buyers", () => {
  const scenario = tertiaryFixture();
  const market = evaluateMarket(scenario);
  assert.equal(market.winner?.offer.id, "O01");
  assert.deepEqual(market.winner.selectedBuyerIds, ["B01", "B02"]);

  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.planningAid, true);
  assert.match(coverage.note, /not a dual checkout/i);
  assert.equal(coverage.primary.offerId, "O01");
  assert.equal(coverage.secondary.offerId, "O03");
  assert.equal(coverage.tertiary.offerId, "O02");
  assert.notEqual(coverage.primary.offerId, coverage.secondary.offerId);
  assert.notEqual(coverage.secondary.offerId, coverage.tertiary.offerId);
  assert.notEqual(coverage.primary.offerId, coverage.tertiary.offerId);
  assert.deepEqual(coverage.secondary.selectedBuyerIds, ["B05", "B06"]);
  assert.deepEqual(coverage.tertiary.selectedBuyerIds, ["B03", "B04"]);
  assert.equal(coverage.secondary.fulfilledUnits, 11);
  assert.equal(coverage.tertiary.fulfilledUnits, 9);
  assert.equal(coverage.leftoverBuyerCount, 4);
  assert.equal(coverage.unfilledBuyerCount, 0);
  assert.equal(coverage.unfilledUnits, 0);
  assert.equal(
    coverage.primary.fulfilledUnits + coverage.secondary.fulfilledUnits + coverage.tertiary.fulfilledUnits,
    32
  );
});

test("tertiary residual fill is omitted when leftover demand has no third offer", () => {
  const scenario = leftoverFixture();
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.primary.offerId, "O01");
  assert.equal(coverage.secondary.offerId, "O02");
  assert.equal(coverage.tertiary, null);
  assert.equal(coverage.unfilledBuyerCount, 0);
});

test("tertiary residual fill leaves remaining buyers when the third offer misses its minimum", () => {
  const scenario = tertiaryFixture();
  scenario.offers[1].minimumUnits = 40;
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.primary.offerId, "O01");
  assert.equal(coverage.secondary.offerId, "O03");
  assert.equal(coverage.tertiary, null);
  assert.deepEqual(coverage.leftoverBuyerIds, ["B03", "B04", "B05", "B06"]);
  assert.equal(coverage.unfilledBuyerCount, 2);
  assert.equal(coverage.unfilledUnits, 9);
});
