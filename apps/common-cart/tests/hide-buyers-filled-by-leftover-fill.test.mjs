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

test("hide leftover-fill buyers is display-only and leaves matching unchanged", () => {
  const scenario = leftoverFillFixture();
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const leftoverFillIds = new Set(computeResidualCoverage(scenario).secondary?.selectedBuyerIds ?? []);
  const shown = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true);
  const all = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(leftoverFillIds.size > 0);
  assert.ok(shown.length < original.length);
  for (const id of leftoverFillIds) assert.equal(shown.includes(id), false);
  for (const id of shown) assert.equal(leftoverFillIds.has(id), false);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("winner-allocated and unserved buyers stay visible when hiding leftover-fill buyers", () => {
  const scenario = leftoverFillFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = new Set(market.winner.selectedBuyerIds);
  const leftoverFillIds = new Set(coverage.secondary?.selectedBuyerIds ?? []);
  const shown = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true);
  assert.ok(leftoverFillIds.size > 0);
  for (const id of leftoverFillIds) assert.equal(shown.includes(id), false);
  for (const id of winnerIds) assert.equal(shown.includes(id), true);
  assert.equal(shown.includes("B05"), true);
  assert.equal(filterBuyerIdsHidingUnservedBuyers(scenario, true).includes("B05"), false);
  assert.equal(filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true).includes("B05"), true);
});

test("hide leftover-fill buyers is distinct from leftover-only, leftover, unserved, winner-allocated, and excluded filters", () => {
  const scenario = leftoverFillFixture();
  const leftoverFill = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const winnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.notDeepEqual(leftoverFill, leftoverOnly);
  assert.notDeepEqual(leftoverFill, leftover);
  assert.notDeepEqual(leftoverFill, unserved);
  assert.notDeepEqual(leftoverFill, winnerAllocated);
  assert.notDeepEqual(leftoverFill, included);
  assert.notDeepEqual(leftoverFill, filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, false));
  assert.notEqual(filterBuyerIdsHidingBuyersFilledByLeftoverFill.name, filterBuyerIdsHidingFullyFilled.name);
  assert.notEqual("hideBuyersFilledByLeftoverFill", "hideWinnerAllocatedBuyers");
  assert.notEqual("hideBuyersFilledByLeftoverFill", "hideLeftoverOnlyBuyers");
  assert.notEqual("hideBuyersFilledByLeftoverFill", "hideUnservedBuyers");
  assert.notEqual("hideBuyersFilledByLeftoverFill", "hideBuyersWithLeftover");
  const neighbourhood = clonePreset("neighbourhood");
  assert.notDeepEqual(
    filterBuyerIdsHidingBuyersFilledByLeftoverFill(neighbourhood, true),
    filterBuyerIdsHidingWinnerAllocatedBuyers(neighbourhood, true)
  );
  assert.notDeepEqual(
    filterBuyerIdsHidingBuyersFilledByLeftoverFill(neighbourhood, true),
    filterBuyerIdsHidingUnservedBuyers(neighbourhood, true)
  );
});

test("hide leftover-fill buyers keeps every buyer when leftover fill is missing", () => {
  const scenario = leftoverFillFixture();
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.equal(evaluateMarket(scenario).winner, null);
  assert.equal(computeResidualCoverage(scenario).secondary, null);
  assert.deepEqual(filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true), original);
});

test("hide leftover-fill buyers rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, 1), ScenarioError);
});

test("the organizer hide leftover-fill buyers filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-buyers-filled-by-leftover-fill"/u);
  assert.match(buyerPanel, /Hide buyers filled by leftover fill/u);
  assert.match(buyerPanel, /id="hide-winner-allocated-buyers"/u);
  assert.match(buyerPanel, /id="hide-leftover-only-buyers"/u);
  assert.match(buyerPanel, /id="hide-unserved-buyers"/u);
  assert.match(buyerPanel, /id="hide-buyers-with-leftover"/u);
  assert.match(buyerPanel, /id="hide-fully-filled-buyers"/u);
  assert.match(buyerPanel, /id="hide-excluded-buyers"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-buyers-filled-by-leftover-fill"), false);
  assert.equal(merchantPanel.includes("hideBuyersFilledByLeftoverFill"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingBuyersFilledByLeftoverFill\(/u);
  assert.match(app, /hideBuyersFilledByLeftoverFill/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(app, /function focusHideBuyersFilledByLeftoverFill\(/u);
  assert.match(app, /#hide-buyers-filled-by-leftover-fill/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(key === "%"\)/u);
  assert.match(html, /aria-keyshortcuts="%"/u);
  assert.match(html, /hide-buyers-filled-by-leftover-fill, hide-last-buyer-filled-by-leftover-fill, and hide-first-buyer-filled-by-leftover-fill choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
