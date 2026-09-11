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
  filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill,
  filterBuyerIdsHidingLastBuyerFilledByLeftoverFill,
  filterBuyerIdsHidingLeftoverOnlyBuyers,
  filterBuyerIdsHidingUnservedBuyers,
  filterBuyerIdsHidingWinnerAllocatedBuyers,
  validateScenario
} from "../src/model.js";

function tertiaryFillFixture() {
  const source = clonePreset("neighbourhood");
  return validateScenario({
    title: "Tertiary-fill fixture",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B05", label: "Juice stall", category: "Juice crates", quantity: 3, maxUnitPrice: 12, latestDeliveryDays: 9, allowedVariants: ["Orange juice"] },
      { ...source.buyers[0], id: "B06", label: "Biscuit stall", category: "Biscuit tins", quantity: 4, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] },
      { ...source.buyers[0], id: "B07", label: "Biscuit annex", category: "Biscuit tins", quantity: 3, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O03", merchant: "Biscuit Co-op", category: "Biscuit tins", variant: "Plain biscuit", unitPrice: 8, minimumUnits: 3, deliveryDays: 7, capacity: 20, shippingPerBuyer: 1 }
    ]
  });
}

test("hide first tertiary-fill buyer is display-only and leaves matching unchanged", () => {
  const scenario = tertiaryFillFixture();
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const tertiaryIds = computeResidualCoverage(scenario).tertiary?.selectedBuyerIds ?? [];
  const shown = filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, true);
  const all = filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(tertiaryIds.length > 1);
  const firstId = tertiaryIds[0];
  assert.equal(shown.includes(firstId), false);
  for (const id of tertiaryIds.slice(1)) assert.equal(shown.includes(id), true);
  assert.ok(shown.length < original.length);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("winner-allocated, leftover-fill, unserved, and other tertiary-fill buyers stay visible when hiding the first tertiary-fill buyer", () => {
  const scenario = tertiaryFillFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = new Set(market.winner.selectedBuyerIds);
  const leftoverFillIds = coverage.secondary?.selectedBuyerIds ?? [];
  const tertiaryIds = coverage.tertiary?.selectedBuyerIds ?? [];
  const firstId = tertiaryIds[0];
  const shown = filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, true);
  assert.ok(tertiaryIds.length > 1);
  assert.ok(leftoverFillIds.length > 1);
  assert.ok(coverage.unfilledBuyerCount > 0);
  assert.equal(shown.includes(firstId), false);
  for (const id of tertiaryIds.slice(1)) assert.equal(shown.includes(id), true);
  for (const id of leftoverFillIds) assert.equal(shown.includes(id), true);
  for (const id of winnerIds) assert.equal(shown.includes(id), true);
  assert.equal(shown.includes("B05"), true);
  assert.equal(filterBuyerIdsHidingUnservedBuyers(scenario, true).includes("B05"), false);
  assert.equal(filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true).includes("B05"), true);
});

test("hide first tertiary-fill buyer is distinct from first leftover-fill, last leftover-fill, leftover-fill-all, leftover-only, leftover, unserved, and winner-allocated filters", () => {
  const scenario = tertiaryFillFixture();
  const firstTertiary = filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, true);
  const firstLeftover = filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, true);
  const lastOnly = filterBuyerIdsHidingLastBuyerFilledByLeftoverFill(scenario, true);
  const leftoverFill = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const winnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.notDeepEqual(firstTertiary, firstLeftover);
  assert.notDeepEqual(firstTertiary, lastOnly);
  assert.notDeepEqual(firstTertiary, leftoverFill);
  assert.notDeepEqual(firstTertiary, leftoverOnly);
  assert.notDeepEqual(firstTertiary, leftover);
  assert.notDeepEqual(firstTertiary, unserved);
  assert.notDeepEqual(firstTertiary, winnerAllocated);
  assert.notDeepEqual(firstTertiary, included);
  assert.notDeepEqual(firstTertiary, filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, false));
  assert.notEqual(filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill.name, filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill.name);
  assert.notEqual(filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill.name, filterBuyerIdsHidingLastBuyerFilledByLeftoverFill.name);
  assert.notEqual(filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill.name, filterBuyerIdsHidingFullyFilled.name);
  assert.notEqual("hideFirstBuyerFilledByTertiaryFill", "hideFirstBuyerFilledByLeftoverFill");
  assert.notEqual("hideFirstBuyerFilledByTertiaryFill", "hideLastBuyerFilledByLeftoverFill");
  assert.notEqual("hideFirstBuyerFilledByTertiaryFill", "hideBuyersFilledByLeftoverFill");
});

test("hide first tertiary-fill buyer keeps every buyer when tertiary fill is missing", () => {
  const scenario = clonePreset("tennisCarnivalLunch");
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.ok(evaluateMarket(scenario).winner);
  assert.equal(computeResidualCoverage(scenario).tertiary, null);
  assert.deepEqual(filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, true), original);
});

test("hide first tertiary-fill buyer rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, 1), ScenarioError);
});

test("the organizer hide first tertiary-fill buyer filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-first-buyer-filled-by-tertiary-fill"/u);
  assert.match(buyerPanel, /Hide the first buyer filled by tertiary fill/u);
  assert.match(buyerPanel, /id="hide-first-buyer-filled-by-leftover-fill"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-first-buyer-filled-by-tertiary-fill"), false);
  assert.equal(merchantPanel.includes("hideFirstBuyerFilledByTertiaryFill"), false);
  assert.equal(merchantPanel.includes("copy-leftover-fill-minimum"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill\(/u);
  assert.match(app, /hideFirstBuyerFilledByTertiaryFill/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /hide-first-buyer-filled-by-leftover-fill, hide-first-buyer-filled-by-tertiary-fill, hide-last-buyer-filled-by-tertiary-fill, hide-last-unserved-buyer, hide-first-unserved-buyer, hide-last-leftover-only-buyer, and hide-first-leftover-only-buyer choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
