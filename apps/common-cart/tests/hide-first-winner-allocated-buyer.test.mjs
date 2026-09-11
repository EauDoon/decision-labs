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
  filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill,
  filterBuyerIdsHidingFirstLeftoverOnlyBuyer,
  filterBuyerIdsHidingFirstUnservedBuyer,
  filterBuyerIdsHidingFirstWinnerAllocatedBuyer,
  filterBuyerIdsHidingLastBuyerFilledByLeftoverFill,
  filterBuyerIdsHidingLastBuyerFilledByTertiaryFill,
  filterBuyerIdsHidingLastLeftoverOnlyBuyer,
  filterBuyerIdsHidingLastUnservedBuyer,
  filterBuyerIdsHidingLastWinnerAllocatedBuyer,
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
      { ...source.buyers[0], id: "B07", label: "Biscuit annex", category: "Biscuit tins", quantity: 3, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] },
      { ...source.buyers[0], id: "B08", label: "Flower stall", category: "Flower bunches", quantity: 2, maxUnitPrice: 16, latestDeliveryDays: 3, allowedVariants: ["Daisies"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O03", merchant: "Biscuit Co-op", category: "Biscuit tins", variant: "Plain biscuit", unitPrice: 8, minimumUnits: 3, deliveryDays: 7, capacity: 20, shippingPerBuyer: 1 }
    ]
  });
}

test("hide first winner-allocated buyer is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("waterPoloCarnivalLunch");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const shown = filterBuyerIdsHidingFirstWinnerAllocatedBuyer(scenario, true);
  const all = filterBuyerIdsHidingFirstWinnerAllocatedBuyer(scenario, false);
  const allWinnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const lastWinnerAllocated = filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, true);
  assert.deepEqual(all, original);
  assert.equal(shown.includes("B01"), false);
  assert.equal(shown.includes("B02"), true);
  assert.equal(shown.includes("B05"), true);
  assert.equal(allWinnerAllocated.includes("B01"), false);
  assert.equal(allWinnerAllocated.includes("B02"), false);
  assert.equal(allWinnerAllocated.includes("B05"), false);
  assert.equal(lastWinnerAllocated.includes("B05"), false);
  assert.equal(lastWinnerAllocated.includes("B01"), true);
  assert.ok(shown.length < original.length);
  assert.notDeepEqual(shown, lastWinnerAllocated);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("softball carnival lunch first winner-allocated id matches water polo first winner-allocated order", () => {
  const waterPolo = clonePreset("waterPoloCarnivalLunch");
  const softball = clonePreset("softballCarnivalLunch");
  const waterPoloFirst = filterBuyerIdsHidingFirstWinnerAllocatedBuyer(waterPolo, true);
  const softballFirst = filterBuyerIdsHidingFirstWinnerAllocatedBuyer(softball, true);
  assert.equal(waterPoloFirst.includes("B01"), false);
  assert.equal(waterPoloFirst.includes("B02"), true);
  assert.equal(waterPoloFirst.includes("B05"), true);
  assert.equal(softballFirst.includes("B01"), false);
  assert.equal(softballFirst.includes("B02"), true);
  assert.equal(softballFirst.includes("B05"), true);
});

test("leftover-only, leftover-fill, tertiary-fill, unserved, and other winner-allocated buyers stay visible when hiding the first winner-allocated buyer", () => {
  const scenario = tertiaryFillFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = market.winner.selectedBuyerIds;
  const leftoverFillIds = coverage.secondary?.selectedBuyerIds ?? [];
  const tertiaryIds = coverage.tertiary?.selectedBuyerIds ?? [];
  const shown = filterBuyerIdsHidingFirstWinnerAllocatedBuyer(scenario, true);
  const allWinnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const lastWinnerAllocated = filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, true);
  assert.equal(shown.includes("B01"), false);
  assert.equal(shown.includes("B02"), true);
  assert.equal(shown.includes("B03"), true);
  assert.equal(shown.includes("B04"), true);
  assert.equal(shown.includes("B05"), true);
  assert.equal(shown.includes("B06"), true);
  assert.equal(shown.includes("B07"), true);
  assert.equal(shown.includes("B08"), true);
  assert.equal(allWinnerAllocated.includes("B01"), false);
  assert.equal(allWinnerAllocated.includes("B02"), false);
  assert.equal(lastWinnerAllocated.includes("B02"), false);
  assert.equal(lastWinnerAllocated.includes("B01"), true);
  for (const id of leftoverFillIds) assert.equal(shown.includes(id), true);
  for (const id of tertiaryIds) assert.equal(shown.includes(id), true);
  for (const id of winnerIds) {
    if (id !== "B01") assert.equal(shown.includes(id), true);
  }
  assert.notDeepEqual(shown, allWinnerAllocated);
  assert.notDeepEqual(shown, lastWinnerAllocated);
});

test("hide first winner-allocated buyer is distinct from all winner-allocated, last winner-allocated, and leftover-only", () => {
  const scenario = tertiaryFillFixture();
  const firstWinnerAllocated = filterBuyerIdsHidingFirstWinnerAllocatedBuyer(scenario, true);
  const lastWinnerAllocated = filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, true);
  const winnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const lastLeftoverOnly = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  const firstLeftoverOnly = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true);
  const lastUnserved = filterBuyerIdsHidingLastUnservedBuyer(scenario, true);
  const firstUnserved = filterBuyerIdsHidingFirstUnservedBuyer(scenario, true);
  const lastTertiary = filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, true);
  const firstTertiary = filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, true);
  const lastLeftoverFill = filterBuyerIdsHidingLastBuyerFilledByLeftoverFill(scenario, true);
  const leftoverFill = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.equal(firstWinnerAllocated.includes("B01"), false);
  assert.equal(firstWinnerAllocated.includes("B02"), true);
  assert.equal(lastWinnerAllocated.includes("B02"), false);
  assert.equal(winnerAllocated.includes("B01"), false);
  assert.equal(lastLeftoverOnly.includes("B07"), false);
  assert.equal(firstLeftoverOnly.includes("B03"), false);
  assert.notDeepEqual(firstWinnerAllocated, lastWinnerAllocated);
  assert.notDeepEqual(firstWinnerAllocated, winnerAllocated);
  assert.notDeepEqual(firstWinnerAllocated, lastLeftoverOnly);
  assert.notDeepEqual(firstWinnerAllocated, firstLeftoverOnly);
  assert.notDeepEqual(firstWinnerAllocated, lastUnserved);
  assert.notDeepEqual(firstWinnerAllocated, firstUnserved);
  assert.notDeepEqual(firstWinnerAllocated, lastLeftoverFill);
  assert.notDeepEqual(firstWinnerAllocated, leftoverFill);
  assert.notDeepEqual(firstWinnerAllocated, leftoverOnly);
  assert.notDeepEqual(firstWinnerAllocated, leftover);
  assert.notDeepEqual(firstWinnerAllocated, unserved);
  assert.notDeepEqual(firstWinnerAllocated, included);
  assert.notDeepEqual(firstWinnerAllocated, firstTertiary);
  assert.notDeepEqual(firstWinnerAllocated, lastTertiary);
  assert.notDeepEqual(firstWinnerAllocated, filterBuyerIdsHidingFirstWinnerAllocatedBuyer(scenario, false));
  assert.notEqual(filterBuyerIdsHidingFirstWinnerAllocatedBuyer.name, filterBuyerIdsHidingLastWinnerAllocatedBuyer.name);
  assert.notEqual(filterBuyerIdsHidingFirstWinnerAllocatedBuyer.name, filterBuyerIdsHidingWinnerAllocatedBuyers.name);
  assert.notEqual(filterBuyerIdsHidingFirstWinnerAllocatedBuyer.name, filterBuyerIdsHidingFullyFilled.name);
  assert.notEqual("hideFirstWinnerAllocatedBuyer", "hideLastWinnerAllocatedBuyer");
  assert.notEqual("hideFirstWinnerAllocatedBuyer", "hideWinnerAllocatedBuyers");
  assert.notEqual("hideFirstWinnerAllocatedBuyer", "hideLastLeftoverOnlyBuyer");
  assert.notEqual("hideFirstWinnerAllocatedBuyer", "hideFirstLeftoverOnlyBuyer");
});

test("hide first winner-allocated buyer keeps every buyer when none unlock", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.equal(evaluateMarket(scenario).winner, null);
  assert.deepEqual(filterBuyerIdsHidingFirstWinnerAllocatedBuyer(scenario, true), original);
});

test("hide first winner-allocated buyer rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingFirstWinnerAllocatedBuyer(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingFirstWinnerAllocatedBuyer(scenario, 1), ScenarioError);
});

test("the organizer hide first winner-allocated buyer filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-first-winner-allocated-buyer"/u);
  assert.match(buyerPanel, /Hide the first winner-allocated buyer/u);
  assert.match(buyerPanel, /id="hide-last-winner-allocated-buyer"/u);
  assert.match(buyerPanel, /id="hide-winner-allocated-buyers"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-first-winner-allocated-buyer"), false);
  assert.equal(merchantPanel.includes("hideFirstWinnerAllocatedBuyer"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-count"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingFirstWinnerAllocatedBuyer\(/u);
  assert.match(app, /hideFirstWinnerAllocatedBuyer/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /hide-last-winner-allocated-buyer, hide-first-winner-allocated-buyer, and hide-first-uncovered-leftover-buyer choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
