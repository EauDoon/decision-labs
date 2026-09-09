import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, computeResidualCoverage, createOrganizerBriefing, evaluateMarket } from "../src/model.js";

test("organizer briefing includes aggregates and omits private buyer rows", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.title = "Briefing room";
  const briefing = createOrganizerBriefing(scenario);
  const market = evaluateMarket(scenario);
  const residual = computeResidualCoverage(scenario);
  assert.match(briefing, /Briefing room/);
  assert.match(briefing, /AUD/);
  assert.match(briefing, new RegExp(`Fulfilled units: ${market.winner.fulfilledUnits}`));
  assert.match(briefing, new RegExp(`Excluded buyers: ${market.winner.buyerOutcomes.filter((outcome) => outcome.status !== "included").length}`));
  assert.match(briefing, /Residual coverage/);
  assert.match(briefing, /planning aid/i);
  assert.equal(briefing.includes("SECRET_LABEL"), false);
  assert.equal(briefing.includes("SECRET_ID"), false);
  assert.equal(briefing.includes("maxUnitPrice"), false);
  assert.equal(briefing.includes("leftoverBuyerIds"), false);
  if (residual.secondary) {
    assert.match(briefing, new RegExp(residual.secondary.merchant));
  }
});

test("organizer briefing stays aggregate when leftover buyers exist", () => {
  const scenario = clonePreset("neighbourhood");
  const labels = scenario.buyers.map((buyer) => buyer.label);
  const briefing = createOrganizerBriefing(scenario);
  for (const label of labels) assert.equal(briefing.includes(label), false);
  assert.match(briefing, /Leftover after winner:/);
  assert.match(briefing, /Still unfilled:/);
  assert.match(briefing, /Tertiary fill:/);
});

test("organizer briefing names tertiary fill without private buyer rows", () => {
  const source = clonePreset("neighbourhood");
  const scenario = {
    title: "Tertiary briefing room",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "SECRET_COFFEE", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "SECRET_ANNEX", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "SECRET_TEA", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "SECRET_LOFT", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B05", label: "SECRET_PANTRY", category: "Pantry box", quantity: 6, maxUnitPrice: 50, latestDeliveryDays: 5, allowedVariants: ["Standard"] },
      { ...source.buyers[0], id: "B06", label: "SECRET_HALL", category: "Pantry box", quantity: 5, maxUnitPrice: 50, latestDeliveryDays: 5, allowedVariants: ["Standard"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O03", merchant: "Shared Shelf", category: "Pantry box", variant: "Standard", unitPrice: 42, minimumUnits: 8, deliveryDays: 4, capacity: 20, shippingPerBuyer: 1 }
    ]
  };
  const briefing = createOrganizerBriefing(scenario);
  const residual = computeResidualCoverage(scenario);
  assert.equal(residual.tertiary?.merchant, "Leaf Collective");
  assert.match(briefing, /Tertiary fill: Leaf Collective \/ Black tea, 9 units, 2 buyers\./);
  assert.equal(briefing.includes("SECRET_COFFEE"), false);
  assert.equal(briefing.includes("SECRET_TEA"), false);
  assert.equal(briefing.includes("SECRET_PANTRY"), false);
  assert.equal(briefing.includes("leftoverBuyerIds"), false);
});
