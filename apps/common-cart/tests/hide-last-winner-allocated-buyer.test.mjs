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

test("hide last winner-allocated buyer is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("softballCarnivalLunch");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const shown = filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, true);
  const all = filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, false);
  const allWinnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  assert.deepEqual(all, original);
  assert.equal(shown.includes("B05"), false);
  assert.equal(shown.includes("B01"), true);
  assert.equal(shown.includes("B02"), true);
  assert.equal(allWinnerAllocated.includes("B01"), false);
  assert.equal(allWinnerAllocated.includes("B02"), false);
  assert.equal(allWinnerAllocated.includes("B05"), false);
  assert.ok(shown.length < original.length);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("baseball carnival lunch last winner-allocated id matches softball last winner-allocated order", () => {
  const softball = clonePreset("softballCarnivalLunch");
  const baseball = clonePreset("baseballCarnivalLunch");
  const softballLast = filterBuyerIdsHidingLastWinnerAllocatedBuyer(softball, true);
  const baseballLast = filterBuyerIdsHidingLastWinnerAllocatedBuyer(baseball, true);
  assert.equal(softballLast.includes("B05"), false);
  assert.equal(softballLast.includes("B01"), true);
  assert.equal(softballLast.includes("B02"), true);
  assert.equal(baseballLast.includes("B05"), false);
  assert.equal(baseballLast.includes("B01"), true);
  assert.equal(baseballLast.includes("B02"), true);
});

test("leftover-only, leftover-fill, tertiary-fill, unserved, and other winner-allocated buyers stay visible when hiding the last winner-allocated buyer", () => {
  const scenario = tertiaryFillFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = market.winner.selectedBuyerIds;
  const leftoverFillIds = coverage.secondary?.selectedBuyerIds ?? [];
  const tertiaryIds = coverage.tertiary?.selectedBuyerIds ?? [];
  const shown = filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, true);
  const allWinnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const lastLeftoverOnly = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  assert.equal(shown.includes("B02"), false);
  assert.equal(shown.includes("B01"), true);
  assert.equal(shown.includes("B03"), true);
  assert.equal(shown.includes("B04"), true);
  assert.equal(shown.includes("B05"), true);
  assert.equal(shown.includes("B06"), true);
  assert.equal(shown.includes("B07"), true);
  assert.equal(shown.includes("B08"), true);
  assert.equal(allWinnerAllocated.includes("B01"), false);
  assert.equal(allWinnerAllocated.includes("B02"), false);
  assert.equal(lastLeftoverOnly.includes("B07"), false);
  for (const id of leftoverFillIds) assert.equal(shown.includes(id), true);
  for (const id of tertiaryIds) assert.equal(shown.includes(id), true);
  for (const id of winnerIds) {
    if (id !== "B02") assert.equal(shown.includes(id), true);
  }
  assert.notDeepEqual(shown, allWinnerAllocated);
  assert.notDeepEqual(shown, lastLeftoverOnly);
});

test("hide last winner-allocated buyer is distinct from all winner-allocated, last leftover-only, and first leftover-only", () => {
  const scenario = tertiaryFillFixture();
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
  assert.equal(lastWinnerAllocated.includes("B02"), false);
  assert.equal(lastWinnerAllocated.includes("B01"), true);
  assert.equal(winnerAllocated.includes("B01"), false);
  assert.equal(lastLeftoverOnly.includes("B07"), false);
  assert.equal(firstLeftoverOnly.includes("B03"), false);
  assert.notDeepEqual(lastWinnerAllocated, winnerAllocated);
  assert.notDeepEqual(lastWinnerAllocated, lastLeftoverOnly);
  assert.notDeepEqual(lastWinnerAllocated, firstLeftoverOnly);
  assert.notDeepEqual(lastWinnerAllocated, lastUnserved);
  assert.notDeepEqual(lastWinnerAllocated, firstUnserved);
  assert.notDeepEqual(lastWinnerAllocated, lastLeftoverFill);
  assert.notDeepEqual(lastWinnerAllocated, leftoverFill);
  assert.notDeepEqual(lastWinnerAllocated, leftoverOnly);
  assert.notDeepEqual(lastWinnerAllocated, leftover);
  assert.notDeepEqual(lastWinnerAllocated, unserved);
  assert.notDeepEqual(lastWinnerAllocated, included);
  assert.notDeepEqual(lastWinnerAllocated, firstTertiary);
  assert.notDeepEqual(lastWinnerAllocated, lastTertiary);
  assert.notDeepEqual(lastWinnerAllocated, filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, false));
  assert.notEqual(filterBuyerIdsHidingLastWinnerAllocatedBuyer.name, filterBuyerIdsHidingWinnerAllocatedBuyers.name);
  assert.notEqual(filterBuyerIdsHidingLastWinnerAllocatedBuyer.name, filterBuyerIdsHidingLastLeftoverOnlyBuyer.name);
  assert.notEqual(filterBuyerIdsHidingLastWinnerAllocatedBuyer.name, filterBuyerIdsHidingFullyFilled.name);
  assert.notEqual("hideLastWinnerAllocatedBuyer", "hideWinnerAllocatedBuyers");
  assert.notEqual("hideLastWinnerAllocatedBuyer", "hideLastLeftoverOnlyBuyer");
  assert.notEqual("hideLastWinnerAllocatedBuyer", "hideFirstLeftoverOnlyBuyer");
  assert.notEqual("hideLastWinnerAllocatedBuyer", "hideLastUnservedBuyer");
});

test("hide last winner-allocated buyer keeps every buyer when none unlock", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.equal(evaluateMarket(scenario).winner, null);
  assert.deepEqual(filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, true), original);
});

test("hide last winner-allocated buyer rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, 1), ScenarioError);
});

test("the organizer hide last winner-allocated buyer filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-last-winner-allocated-buyer"/u);
  assert.match(buyerPanel, /Hide the last winner-allocated buyer/u);
  assert.match(buyerPanel, /id="hide-winner-allocated-buyers"/u);
  assert.match(buyerPanel, /id="hide-last-leftover-only-buyer"/u);
  assert.match(buyerPanel, /id="hide-first-leftover-only-buyer"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-last-winner-allocated-buyer"), false);
  assert.equal(merchantPanel.includes("hideLastWinnerAllocatedBuyer"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-minimum"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingLastWinnerAllocatedBuyer\(/u);
  assert.match(app, /hideLastWinnerAllocatedBuyer/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /hide-first-leftover-only-buyer, hide-last-winner-allocated-buyer, and hide-first-winner-allocated-buyer choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
