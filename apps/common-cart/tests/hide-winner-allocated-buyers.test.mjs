import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  computeResidualCoverage,
  evaluateMarket,
  filterBuyerIdsHidingBuyersWithLeftover,
  filterBuyerIdsHidingExcluded,
  filterBuyerIdsHidingFullyFilled,
  filterBuyerIdsHidingLeftoverOnlyBuyers,
  filterBuyerIdsHidingUnservedBuyers,
  filterBuyerIdsHidingWinnerAllocatedBuyers,
  validateScenario
} from "../src/model.js";

function leftoverOnlyFixture() {
  const source = clonePreset("neighbourhood");
  return validateScenario({
    title: "Winner-allocated fixture",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B05", label: "Juice stall", category: "Juice crates", quantity: 3, maxUnitPrice: 12, latestDeliveryDays: 9, allowedVariants: ["Orange juice"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 }
    ]
  });
}

test("hide winner-allocated buyers is display-only and leaves matching unchanged", () => {
  const scenario = leftoverOnlyFixture();
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const winnerIds = new Set(market.winner.selectedBuyerIds);
  const shown = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const all = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(shown.length < original.length);
  for (const id of winnerIds) assert.equal(shown.includes(id), false);
  for (const id of shown) assert.equal(winnerIds.has(id), false);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("leftover-only and unserved buyers stay visible when hiding winner-allocated buyers", () => {
  const scenario = leftoverOnlyFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = new Set(market.winner.selectedBuyerIds);
  const leftoverFillIds = new Set(coverage.secondary?.selectedBuyerIds ?? []);
  const tertiaryIds = new Set(coverage.tertiary?.selectedBuyerIds ?? []);
  const leftoverOnly = scenario.buyers.filter((buyer) => !winnerIds.has(buyer.id) && (leftoverFillIds.has(buyer.id) || tertiaryIds.has(buyer.id))).map((buyer) => buyer.id);
  const shown = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  assert.ok(leftoverOnly.length > 0);
  for (const id of leftoverOnly) assert.equal(shown.includes(id), true);
  assert.equal(shown.includes("B05"), true);
  assert.equal(filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true).includes("B05"), true);
  assert.equal(filterBuyerIdsHidingUnservedBuyers(scenario, true).includes("B05"), false);
});

test("hide winner-allocated buyers is distinct from leftover-only, leftover, unserved, and excluded filters", () => {
  const scenario = leftoverOnlyFixture();
  const winnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.notDeepEqual(winnerAllocated, leftoverOnly);
  assert.notDeepEqual(winnerAllocated, leftover);
  assert.notDeepEqual(winnerAllocated, unserved);
  assert.notDeepEqual(winnerAllocated, included);
  assert.notDeepEqual(winnerAllocated, filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, false));
  assert.notEqual(filterBuyerIdsHidingWinnerAllocatedBuyers.name, filterBuyerIdsHidingFullyFilled.name);
  assert.notEqual("hideWinnerAllocatedBuyers", "hideFullyFilledBuyers");
  assert.notEqual("hideWinnerAllocatedBuyers", "hideLeftoverOnlyBuyers");
  assert.notEqual("hideWinnerAllocatedBuyers", "hideUnservedBuyers");
  assert.notEqual("hideWinnerAllocatedBuyers", "hideBuyersWithLeftover");
  const neighbourhood = clonePreset("neighbourhood");
  assert.notDeepEqual(
    filterBuyerIdsHidingWinnerAllocatedBuyers(neighbourhood, true),
    filterBuyerIdsHidingLeftoverOnlyBuyers(neighbourhood, true)
  );
  assert.notDeepEqual(
    filterBuyerIdsHidingWinnerAllocatedBuyers(neighbourhood, true),
    filterBuyerIdsHidingUnservedBuyers(neighbourhood, true)
  );
  assert.notDeepEqual(
    filterBuyerIdsHidingWinnerAllocatedBuyers(neighbourhood, true),
    filterBuyerIdsHidingBuyersWithLeftover(neighbourhood, true)
  );
});

test("hide winner-allocated buyers keeps every buyer when none unlock", () => {
  const scenario = leftoverOnlyFixture();
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.equal(evaluateMarket(scenario).winner, null);
  assert.deepEqual(filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true), original);
});

test("hide winner-allocated buyers rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, 1), ScenarioError);
});

test("the organizer hide-winner-allocated-buyers filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-winner-allocated-buyers"/u);
  assert.match(buyerPanel, /Hide buyers that received winner units/u);
  assert.match(buyerPanel, /id="hide-leftover-only-buyers"/u);
  assert.match(buyerPanel, /id="hide-unserved-buyers"/u);
  assert.match(buyerPanel, /id="hide-buyers-with-leftover"/u);
  assert.match(buyerPanel, /id="hide-fully-filled-buyers"/u);
  assert.match(buyerPanel, /id="hide-excluded-buyers"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-winner-allocated-buyers"), false);
  assert.equal(merchantPanel.includes("hideWinnerAllocatedBuyers"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingWinnerAllocatedBuyers\(/u);
  assert.match(app, /hideWinnerAllocatedBuyers/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /hide-winner-allocated-buyers, hide-buyers-filled-by-leftover-fill, hide-last-buyer-filled-by-leftover-fill, hide-first-buyer-filled-by-leftover-fill, and hide-first-buyer-filled-by-tertiary-fill choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
