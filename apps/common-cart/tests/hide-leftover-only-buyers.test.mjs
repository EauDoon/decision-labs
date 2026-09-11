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
  validateScenario
} from "../src/model.js";

function leftoverOnlyFixture() {
  const source = clonePreset("neighbourhood");
  return validateScenario({
    title: "Leftover-only fixture",
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

test("hide leftover-only buyers is display-only and leaves matching unchanged", () => {
  const scenario = leftoverOnlyFixture();
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const coverage = computeResidualCoverage(scenario);
  const winnerIds = new Set(market.winner.selectedBuyerIds);
  const leftoverFillIds = new Set(coverage.secondary?.selectedBuyerIds ?? []);
  const tertiaryIds = new Set(coverage.tertiary?.selectedBuyerIds ?? []);
  const leftoverOnly = original.filter((id) => !winnerIds.has(id) && (leftoverFillIds.has(id) || tertiaryIds.has(id)));
  const shown = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const all = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(leftoverOnly.length > 0);
  assert.ok(shown.length < original.length);
  for (const id of leftoverOnly) assert.equal(shown.includes(id), false);
  for (const id of shown) assert.equal(leftoverOnly.includes(id), false);
  assert.ok(shown.includes(market.winner.selectedBuyerIds[0]));
  assert.equal(shown.includes("B05"), true);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("unserved buyers are not leftover-only", () => {
  const scenario = leftoverOnlyFixture();
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  assert.equal(leftoverOnly.includes("B05"), true);
  assert.equal(unserved.includes("B05"), false);
  assert.notDeepEqual(leftoverOnly, unserved);
  const missed = leftoverOnlyFixture();
  missed.offers[1].minimumUnits = 5000;
  const leftoverAfterMiss = filterBuyerIdsHidingLeftoverOnlyBuyers(missed, true);
  const unservedAfterMiss = filterBuyerIdsHidingUnservedBuyers(missed, true);
  assert.deepEqual(leftoverAfterMiss, missed.buyers.map((buyer) => buyer.id));
  assert.equal(unservedAfterMiss.includes("B03"), false);
  assert.equal(unservedAfterMiss.includes("B05"), false);
});

test("hide leftover-only buyers is distinct from leftover, fully filled, unserved, and excluded filters", () => {
  const scenario = leftoverOnlyFixture();
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const filled = filterBuyerIdsHidingFullyFilled(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.notDeepEqual(leftoverOnly, leftover);
  assert.notDeepEqual(leftoverOnly, filled);
  assert.notDeepEqual(leftoverOnly, unserved);
  assert.notDeepEqual(leftoverOnly, included);
  assert.notDeepEqual(leftoverOnly, filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, false));
  const neighbourhood = clonePreset("neighbourhood");
  assert.notDeepEqual(
    filterBuyerIdsHidingLeftoverOnlyBuyers(neighbourhood, true),
    filterBuyerIdsHidingUnservedBuyers(neighbourhood, true)
  );
});

test("hide leftover-only buyers keeps every buyer when leftover fill is missing", () => {
  const scenario = leftoverOnlyFixture();
  scenario.offers[1].minimumUnits = 5000;
  const original = scenario.buyers.map((buyer) => buyer.id);
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.secondary, null);
  assert.equal(coverage.tertiary, null);
  assert.deepEqual(filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true), original);
});

test("hide leftover-only buyers rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, 1), ScenarioError);
});

test("the organizer hide-leftover-only-buyers filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-leftover-only-buyers"/u);
  assert.match(buyerPanel, /Hide leftover-only buyers/u);
  assert.match(buyerPanel, /id="hide-unserved-buyers"/u);
  assert.match(buyerPanel, /id="hide-buyers-with-leftover"/u);
  assert.match(buyerPanel, /id="hide-fully-filled-buyers"/u);
  assert.match(buyerPanel, /id="hide-excluded-buyers"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-leftover-only-buyers"), false);
  assert.equal(merchantPanel.includes("hideLeftoverOnlyBuyers"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingLeftoverOnlyBuyers\(/u);
  assert.match(app, /hideLeftoverOnlyBuyers/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(app, /function focusHideLeftoverOnlyBuyers\(/u);
  assert.match(app, /#hide-leftover-only-buyers/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(key === "@"\)/u);
  assert.match(html, /aria-keyshortcuts="@"/u);
  assert.match(html, /hide-leftover-only-buyers, hide-winner-allocated-buyers, hide-buyers-filled-by-leftover-fill, hide-last-buyer-filled-by-leftover-fill, hide-first-buyer-filled-by-leftover-fill, hide-first-buyer-filled-by-tertiary-fill, hide-last-buyer-filled-by-tertiary-fill, hide-last-unserved-buyer, hide-first-unserved-buyer, hide-last-leftover-only-buyer, hide-first-leftover-only-buyer, hide-last-winner-allocated-buyer, hide-first-winner-allocated-buyer, and hide-first-uncovered-leftover-buyer choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
