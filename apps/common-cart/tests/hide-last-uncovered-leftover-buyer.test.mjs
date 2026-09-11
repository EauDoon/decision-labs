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
  filterBuyerIdsHidingFirstUncoveredLeftoverBuyer,
  filterBuyerIdsHidingFirstUnservedBuyer,
  filterBuyerIdsHidingFirstWinnerAllocatedBuyer,
  filterBuyerIdsHidingLastBuyerFilledByLeftoverFill,
  filterBuyerIdsHidingLastBuyerFilledByTertiaryFill,
  filterBuyerIdsHidingLastLeftoverOnlyBuyer,
  filterBuyerIdsHidingLastUncoveredLeftoverBuyer,
  filterBuyerIdsHidingLastUnservedBuyer,
  filterBuyerIdsHidingLastWinnerAllocatedBuyer,
  filterBuyerIdsHidingLeftoverOnlyBuyers,
  filterBuyerIdsHidingUnservedBuyers,
  filterBuyerIdsHidingWinnerAllocatedBuyers,
  validateScenario
} from "../src/model.js";

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

test("hide last uncovered leftover buyer is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("sailingCarnivalLunch");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const shown = filterBuyerIdsHidingLastUncoveredLeftoverBuyer(scenario, true);
  const all = filterBuyerIdsHidingLastUncoveredLeftoverBuyer(scenario, false);
  const firstUncovered = filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, true);
  const firstLeftoverOnly = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true);
  assert.deepEqual(all, original);
  assert.equal(shown.includes("B06"), false);
  assert.equal(shown.includes("B03"), true);
  assert.equal(shown.includes("B04"), true);
  assert.equal(shown.includes("B01"), true);
  assert.equal(firstLeftoverOnly.includes("B03"), false);
  assert.equal(firstLeftoverOnly.includes("B06"), true);
  assert.ok(shown.length < original.length);
  assert.notDeepEqual(shown, firstLeftoverOnly);
  assert.deepEqual(firstUncovered, shown);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("sailing carnival lunch last uncovered leftover id matches rowing last uncovered leftover order", () => {
  const sailing = clonePreset("sailingCarnivalLunch");
  const rowing = clonePreset("rowingCarnivalLunch");
  const sailingLast = filterBuyerIdsHidingLastUncoveredLeftoverBuyer(sailing, true);
  const rowingLast = filterBuyerIdsHidingLastUncoveredLeftoverBuyer(rowing, true);
  assert.equal(sailingLast.includes("B06"), false);
  assert.equal(sailingLast.includes("B03"), true);
  assert.equal(rowingLast.includes("B06"), false);
  assert.equal(rowingLast.includes("B03"), true);
});

test("leftover-only, leftover-fill, tertiary-fill, winner-allocated, and other leftover buyers stay visible when hiding the last uncovered leftover buyer", () => {
  const scenario = tertiaryFillFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = market.winner.selectedBuyerIds;
  const leftoverFillIds = coverage.secondary?.selectedBuyerIds ?? [];
  const tertiaryIds = coverage.tertiary?.selectedBuyerIds ?? [];
  const shown = filterBuyerIdsHidingLastUncoveredLeftoverBuyer(scenario, true);
  const firstUncovered = filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, true);
  const firstLeftoverOnly = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true);
  const lastLeftoverOnly = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  assert.equal(shown.includes("B08"), false);
  assert.equal(shown.includes("B05"), true);
  assert.equal(shown.includes("B03"), true);
  assert.equal(shown.includes("B01"), true);
  assert.equal(shown.includes("B06"), true);
  assert.equal(firstUncovered.includes("B05"), false);
  assert.equal(firstUncovered.includes("B08"), true);
  assert.equal(firstLeftoverOnly.includes("B03"), false);
  assert.equal(lastLeftoverOnly.includes("B07"), false);
  for (const id of leftoverFillIds) assert.equal(shown.includes(id), true);
  for (const id of tertiaryIds) assert.equal(shown.includes(id), true);
  for (const id of winnerIds) assert.equal(shown.includes(id), true);
  assert.notDeepEqual(shown, firstUncovered);
  assert.notDeepEqual(shown, firstLeftoverOnly);
  assert.notDeepEqual(shown, lastLeftoverOnly);
});

test("hide last uncovered leftover buyer is distinct from first uncovered leftover, leftover-only, unserved, and winner-allocated", () => {
  const scenario = tertiaryFillFixture();
  const lastUncoveredLeftover = filterBuyerIdsHidingLastUncoveredLeftoverBuyer(scenario, true);
  const firstUncoveredLeftover = filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, true);
  const firstLeftoverOnly = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true);
  const lastLeftoverOnly = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  const firstUnserved = filterBuyerIdsHidingFirstUnservedBuyer(scenario, true);
  const lastUnserved = filterBuyerIdsHidingLastUnservedBuyer(scenario, true);
  const firstWinnerAllocated = filterBuyerIdsHidingFirstWinnerAllocatedBuyer(scenario, true);
  const lastWinnerAllocated = filterBuyerIdsHidingLastWinnerAllocatedBuyer(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const leftoverFill = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const winnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const lastTertiary = filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, true);
  const firstTertiary = filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, true);
  const lastLeftoverFill = filterBuyerIdsHidingLastBuyerFilledByLeftoverFill(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.equal(lastUncoveredLeftover.includes("B08"), false);
  assert.equal(lastUncoveredLeftover.includes("B05"), true);
  assert.equal(firstUncoveredLeftover.includes("B05"), false);
  assert.equal(firstLeftoverOnly.includes("B03"), false);
  assert.equal(lastLeftoverOnly.includes("B07"), false);
  assert.equal(firstWinnerAllocated.includes("B01"), false);
  assert.equal(lastWinnerAllocated.includes("B02"), false);
  assert.notDeepEqual(lastUncoveredLeftover, firstUncoveredLeftover);
  assert.notDeepEqual(lastUncoveredLeftover, firstLeftoverOnly);
  assert.notDeepEqual(lastUncoveredLeftover, lastLeftoverOnly);
  assert.notDeepEqual(lastUncoveredLeftover, firstUnserved);
  assert.notDeepEqual(lastUncoveredLeftover, firstWinnerAllocated);
  assert.notDeepEqual(lastUncoveredLeftover, lastWinnerAllocated);
  assert.notDeepEqual(lastUncoveredLeftover, leftoverFill);
  assert.notDeepEqual(lastUncoveredLeftover, leftoverOnly);
  assert.notDeepEqual(lastUncoveredLeftover, leftover);
  assert.notDeepEqual(lastUncoveredLeftover, unserved);
  assert.notDeepEqual(lastUncoveredLeftover, winnerAllocated);
  assert.notDeepEqual(lastUncoveredLeftover, included);
  assert.notDeepEqual(lastUncoveredLeftover, firstTertiary);
  assert.notDeepEqual(lastUncoveredLeftover, lastTertiary);
  assert.notDeepEqual(lastUncoveredLeftover, lastLeftoverFill);
  assert.notDeepEqual(lastUncoveredLeftover, filterBuyerIdsHidingLastUncoveredLeftoverBuyer(scenario, false));
  assert.notEqual(filterBuyerIdsHidingLastUncoveredLeftoverBuyer.name, filterBuyerIdsHidingFirstUncoveredLeftoverBuyer.name);
  assert.notEqual(filterBuyerIdsHidingLastUncoveredLeftoverBuyer.name, filterBuyerIdsHidingFirstLeftoverOnlyBuyer.name);
  assert.notEqual(filterBuyerIdsHidingLastUncoveredLeftoverBuyer.name, filterBuyerIdsHidingLastLeftoverOnlyBuyer.name);
  assert.notEqual(filterBuyerIdsHidingLastUncoveredLeftoverBuyer.name, filterBuyerIdsHidingFirstUnservedBuyer.name);
  assert.notEqual(filterBuyerIdsHidingLastUncoveredLeftoverBuyer.name, filterBuyerIdsHidingFirstWinnerAllocatedBuyer.name);
  assert.notEqual(filterBuyerIdsHidingLastUncoveredLeftoverBuyer.name, filterBuyerIdsHidingFullyFilled.name);
  assert.notEqual("hideLastUncoveredLeftoverBuyer", "hideFirstUncoveredLeftoverBuyer");
  assert.notEqual("hideLastUncoveredLeftoverBuyer", "hideFirstLeftoverOnlyBuyer");
  assert.notEqual("hideLastUncoveredLeftoverBuyer", "hideLastLeftoverOnlyBuyer");
  assert.notEqual("hideLastUncoveredLeftoverBuyer", "hideFirstUnservedBuyer");
  assert.notEqual("hideLastUncoveredLeftoverBuyer", "hideFirstWinnerAllocatedBuyer");
  assert.notEqual("hideLastUncoveredLeftoverBuyer", "hideLastWinnerAllocatedBuyer");
});

test("leftover fixture leftover-only hide is distinct from last uncovered leftover hide when leftover fill covers leftover buyers", () => {
  const scenario = leftoverFixture();
  const original = scenario.buyers.map((buyer) => buyer.id);
  const coverage = computeResidualCoverage(scenario);
  assert.ok(coverage.leftoverBuyerCount > 0);
  assert.equal(coverage.unfilledBuyerCount, 0);
  const uncovered = filterBuyerIdsHidingLastUncoveredLeftoverBuyer(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true);
  assert.deepEqual(uncovered, original);
  assert.equal(leftoverOnly.includes("B03"), false);
  assert.notDeepEqual(uncovered, leftoverOnly);
});

test("hide last uncovered leftover buyer keeps every buyer when leftover after the winner is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const original = scenario.buyers.map((buyer) => buyer.id);
  const coverage = computeResidualCoverage(scenario);
  assert.ok(evaluateMarket(scenario).winner);
  assert.equal(coverage.leftoverBuyerCount, 0);
  assert.deepEqual(filterBuyerIdsHidingLastUncoveredLeftoverBuyer(scenario, true), original);
});

test("hide last uncovered leftover buyer rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingLastUncoveredLeftoverBuyer(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingLastUncoveredLeftoverBuyer(scenario, 1), ScenarioError);
});

test("the organizer hide last uncovered leftover buyer filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-last-uncovered-leftover-buyer"/u);
  assert.match(buyerPanel, /Hide the last uncovered leftover buyer/u);
  assert.match(buyerPanel, /id="hide-first-uncovered-leftover-buyer"/u);
  assert.match(buyerPanel, /id="hide-first-leftover-only-buyer"/u);
  assert.match(buyerPanel, /id="hide-first-winner-allocated-buyer"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-last-uncovered-leftover-buyer"), false);
  assert.equal(merchantPanel.includes("hideLastUncoveredLeftoverBuyer"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-remaining"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingLastUncoveredLeftoverBuyer\(/u);
  assert.match(app, /hideLastUncoveredLeftoverBuyer/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /hide-first-uncovered-leftover-buyer, and hide-last-uncovered-leftover-buyer choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
