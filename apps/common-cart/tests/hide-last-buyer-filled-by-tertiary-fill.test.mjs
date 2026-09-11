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
  filterBuyerIdsHidingLastBuyerFilledByTertiaryFill,
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

test("hide last tertiary-fill buyer is display-only and leaves matching unchanged", () => {
  const scenario = tertiaryFillFixture();
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const tertiaryIds = computeResidualCoverage(scenario).tertiary?.selectedBuyerIds ?? [];
  const shown = filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, true);
  const all = filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(tertiaryIds.length > 1);
  const lastId = tertiaryIds[tertiaryIds.length - 1];
  assert.equal(shown.includes(lastId), false);
  for (const id of tertiaryIds.slice(0, -1)) assert.equal(shown.includes(id), true);
  assert.ok(shown.length < original.length);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("winner-allocated, leftover-fill, unserved, and other tertiary-fill buyers stay visible when hiding the last tertiary-fill buyer", () => {
  const scenario = tertiaryFillFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = new Set(market.winner.selectedBuyerIds);
  const leftoverFillIds = coverage.secondary?.selectedBuyerIds ?? [];
  const tertiaryIds = coverage.tertiary?.selectedBuyerIds ?? [];
  const lastId = tertiaryIds[tertiaryIds.length - 1];
  const shown = filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, true);
  assert.ok(tertiaryIds.length > 1);
  assert.ok(leftoverFillIds.length > 1);
  assert.ok(coverage.unfilledBuyerCount > 0);
  assert.equal(shown.includes(lastId), false);
  for (const id of tertiaryIds.slice(0, -1)) assert.equal(shown.includes(id), true);
  for (const id of leftoverFillIds) assert.equal(shown.includes(id), true);
  for (const id of winnerIds) assert.equal(shown.includes(id), true);
  assert.equal(shown.includes("B05"), true);
  assert.equal(filterBuyerIdsHidingUnservedBuyers(scenario, true).includes("B05"), false);
  assert.equal(filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true).includes("B05"), true);
});

test("hide last tertiary-fill buyer is distinct from first tertiary-fill, first leftover-fill, last leftover-fill, leftover-fill-all, leftover-only, leftover, unserved, and winner-allocated filters", () => {
  const scenario = tertiaryFillFixture();
  const lastTertiary = filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, true);
  const firstTertiary = filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, true);
  const firstLeftover = filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, true);
  const lastOnly = filterBuyerIdsHidingLastBuyerFilledByLeftoverFill(scenario, true);
  const leftoverFill = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const winnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.notDeepEqual(lastTertiary, firstTertiary);
  assert.notDeepEqual(lastTertiary, firstLeftover);
  assert.notDeepEqual(lastTertiary, lastOnly);
  assert.notDeepEqual(lastTertiary, leftoverFill);
  assert.notDeepEqual(lastTertiary, leftoverOnly);
  assert.notDeepEqual(lastTertiary, leftover);
  assert.notDeepEqual(lastTertiary, unserved);
  assert.notDeepEqual(lastTertiary, winnerAllocated);
  assert.notDeepEqual(lastTertiary, included);
  assert.notDeepEqual(lastTertiary, filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, false));
  assert.notEqual(filterBuyerIdsHidingLastBuyerFilledByTertiaryFill.name, filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill.name);
  assert.notEqual(filterBuyerIdsHidingLastBuyerFilledByTertiaryFill.name, filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill.name);
  assert.notEqual(filterBuyerIdsHidingLastBuyerFilledByTertiaryFill.name, filterBuyerIdsHidingLastBuyerFilledByLeftoverFill.name);
  assert.notEqual(filterBuyerIdsHidingLastBuyerFilledByTertiaryFill.name, filterBuyerIdsHidingFullyFilled.name);
  assert.notEqual("hideLastBuyerFilledByTertiaryFill", "hideFirstBuyerFilledByTertiaryFill");
  assert.notEqual("hideLastBuyerFilledByTertiaryFill", "hideFirstBuyerFilledByLeftoverFill");
  assert.notEqual("hideLastBuyerFilledByTertiaryFill", "hideLastBuyerFilledByLeftoverFill");
  assert.notEqual("hideLastBuyerFilledByTertiaryFill", "hideBuyersFilledByLeftoverFill");
});

test("hide last tertiary-fill buyer keeps every buyer when tertiary fill is missing", () => {
  const scenario = clonePreset("tennisCarnivalLunch");
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.ok(evaluateMarket(scenario).winner);
  assert.equal(computeResidualCoverage(scenario).tertiary, null);
  assert.deepEqual(filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, true), original);
});

test("hide last tertiary-fill buyer rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, 1), ScenarioError);
});

test("the organizer hide last tertiary-fill buyer filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-last-buyer-filled-by-tertiary-fill"/u);
  assert.match(buyerPanel, /Hide the last buyer filled by tertiary fill/u);
  assert.match(buyerPanel, /id="hide-first-buyer-filled-by-tertiary-fill"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-last-buyer-filled-by-tertiary-fill"), false);
  assert.equal(merchantPanel.includes("hideLastBuyerFilledByTertiaryFill"), false);
  assert.equal(merchantPanel.includes("copy-leftover-fill-maximum"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingLastBuyerFilledByTertiaryFill\(/u);
  assert.match(app, /hideLastBuyerFilledByTertiaryFill/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /hide-first-buyer-filled-by-tertiary-fill, hide-last-buyer-filled-by-tertiary-fill, hide-last-unserved-buyer, hide-first-unserved-buyer, hide-last-leftover-only-buyer, hide-first-leftover-only-buyer, and hide-last-winner-allocated-buyer choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
