import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  computeResidualCoverage,
  evaluateMarket,
  filterBuyerIdsHidingBuyersFilledByLeftoverFill,
  filterBuyerIdsHidingBuyersWithLeftover,
  filterBuyerIdsHidingExcluded,
  filterBuyerIdsHidingFullyFilled,
  filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill,
  filterBuyerIdsHidingLastBuyerFilledByLeftoverFill,
  filterBuyerIdsHidingLeftoverOnlyBuyers,
  filterBuyerIdsHidingUnservedBuyers,
  filterBuyerIdsHidingWinnerAllocatedBuyers,
  validateScenario
} from "../src/model.js";

function leftoverFillFixture() {
  const source = clonePreset("neighbourhood");
  return validateScenario({
    title: "Leftover-fill fixture",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B05", label: "Juice stall", category: "Juice crates", quantity: 3, maxUnitPrice: 12, latestDeliveryDays: 9, allowedVariants: ["Orange juice"] },
      { ...source.buyers[0], id: "B06", label: "Biscuit stall", category: "Biscuit tins", quantity: 4, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O03", merchant: "Biscuit Co-op", category: "Biscuit tins", variant: "Plain biscuit", unitPrice: 8, minimumUnits: 3, deliveryDays: 7, capacity: 20, shippingPerBuyer: 1 }
    ]
  });
}

test("hide first leftover-fill buyer is display-only and leaves matching unchanged", () => {
  const scenario = leftoverFillFixture();
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const leftoverFillIds = computeResidualCoverage(scenario).secondary?.selectedBuyerIds ?? [];
  const shown = filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, true);
  const all = filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(leftoverFillIds.length > 1);
  const firstId = leftoverFillIds[0];
  assert.equal(shown.includes(firstId), false);
  for (const id of leftoverFillIds.slice(1)) assert.equal(shown.includes(id), true);
  assert.ok(shown.length < original.length);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("winner-allocated, unserved, and other leftover-fill buyers stay visible when hiding the first leftover-fill buyer", () => {
  const scenario = leftoverFillFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = new Set(market.winner.selectedBuyerIds);
  const leftoverFillIds = coverage.secondary?.selectedBuyerIds ?? [];
  const firstId = leftoverFillIds[0];
  const shown = filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, true);
  assert.ok(leftoverFillIds.length > 1);
  assert.ok(coverage.tertiary?.selectedBuyerIds?.length > 0);
  assert.ok(coverage.unfilledBuyerCount > 0);
  assert.equal(shown.includes(firstId), false);
  for (const id of leftoverFillIds.slice(1)) assert.equal(shown.includes(id), true);
  for (const id of winnerIds) assert.equal(shown.includes(id), true);
  assert.equal(shown.includes("B05"), true);
  assert.equal(shown.includes("B06"), true);
  assert.equal(filterBuyerIdsHidingUnservedBuyers(scenario, true).includes("B05"), false);
  assert.equal(filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true).includes("B05"), true);
});

test("hide first leftover-fill buyer is distinct from last leftover-fill, leftover-fill-all, leftover-only, leftover, unserved, and winner-allocated filters", () => {
  const scenario = leftoverFillFixture();
  const firstOnly = filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, true);
  const lastOnly = filterBuyerIdsHidingLastBuyerFilledByLeftoverFill(scenario, true);
  const leftoverFill = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const winnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.notDeepEqual(firstOnly, lastOnly);
  assert.notDeepEqual(firstOnly, leftoverFill);
  assert.notDeepEqual(firstOnly, leftoverOnly);
  assert.notDeepEqual(firstOnly, leftover);
  assert.notDeepEqual(firstOnly, unserved);
  assert.notDeepEqual(firstOnly, winnerAllocated);
  assert.notDeepEqual(firstOnly, included);
  assert.notDeepEqual(firstOnly, filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, false));
  assert.notEqual(filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill.name, filterBuyerIdsHidingLastBuyerFilledByLeftoverFill.name);
  assert.notEqual(filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill.name, filterBuyerIdsHidingBuyersFilledByLeftoverFill.name);
  assert.notEqual(filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill.name, filterBuyerIdsHidingFullyFilled.name);
  assert.notEqual("hideFirstBuyerFilledByLeftoverFill", "hideLastBuyerFilledByLeftoverFill");
  assert.notEqual("hideFirstBuyerFilledByLeftoverFill", "hideBuyersFilledByLeftoverFill");
  assert.notEqual("hideFirstBuyerFilledByLeftoverFill", "hideWinnerAllocatedBuyers");
});

test("hide first leftover-fill buyer keeps every buyer when leftover fill is missing", () => {
  const scenario = leftoverFillFixture();
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.equal(evaluateMarket(scenario).winner, null);
  assert.equal(computeResidualCoverage(scenario).secondary, null);
  assert.deepEqual(filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, true), original);
});

test("hide first leftover-fill buyer rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, 1), ScenarioError);
});

test("the organizer hide first leftover-fill buyer filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-first-buyer-filled-by-leftover-fill"/u);
  assert.match(buyerPanel, /Hide the first buyer filled by leftover fill/u);
  assert.match(buyerPanel, /id="hide-last-buyer-filled-by-leftover-fill"/u);
  assert.match(buyerPanel, /id="hide-buyers-filled-by-leftover-fill"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-first-buyer-filled-by-leftover-fill"), false);
  assert.equal(merchantPanel.includes("hideFirstBuyerFilledByLeftoverFill"), false);
  assert.equal(merchantPanel.includes("copy-leftover-fill-label"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill\(/u);
  assert.match(app, /hideFirstBuyerFilledByLeftoverFill/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /hide-buyers-filled-by-leftover-fill, hide-last-buyer-filled-by-leftover-fill, hide-first-buyer-filled-by-leftover-fill, hide-first-buyer-filled-by-tertiary-fill, and hide-last-buyer-filled-by-tertiary-fill choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
