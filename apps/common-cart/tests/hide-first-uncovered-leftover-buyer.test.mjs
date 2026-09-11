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

test("hide first uncovered leftover buyer is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("waterPoloCarnivalLunch");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const shown = filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, true);
  const all = filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, false);
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
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("rowing carnival lunch first uncovered leftover id matches water polo first uncovered leftover order", () => {
  const waterPolo = clonePreset("waterPoloCarnivalLunch");
  const rowing = clonePreset("rowingCarnivalLunch");
  const waterPoloFirst = filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(waterPolo, true);
  const rowingFirst = filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(rowing, true);
  assert.equal(waterPoloFirst.includes("B06"), false);
  assert.equal(waterPoloFirst.includes("B03"), true);
  assert.equal(rowingFirst.includes("B06"), false);
  assert.equal(rowingFirst.includes("B03"), true);
});

test("leftover-only, leftover-fill, tertiary-fill, winner-allocated, and other leftover buyers stay visible when hiding the first uncovered leftover buyer", () => {
  const scenario = tertiaryFillFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = market.winner.selectedBuyerIds;
  const leftoverFillIds = coverage.secondary?.selectedBuyerIds ?? [];
  const tertiaryIds = coverage.tertiary?.selectedBuyerIds ?? [];
  const shown = filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, true);
  const firstLeftoverOnly = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true);
  const lastLeftoverOnly = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  assert.equal(shown.includes("B05"), false);
  assert.equal(shown.includes("B08"), true);
  assert.equal(shown.includes("B03"), true);
  assert.equal(shown.includes("B01"), true);
  assert.equal(shown.includes("B06"), true);
  assert.equal(firstLeftoverOnly.includes("B03"), false);
  assert.equal(lastLeftoverOnly.includes("B07"), false);
  for (const id of leftoverFillIds) assert.equal(shown.includes(id), true);
  for (const id of tertiaryIds) assert.equal(shown.includes(id), true);
  for (const id of winnerIds) assert.equal(shown.includes(id), true);
  assert.notDeepEqual(shown, firstLeftoverOnly);
  assert.notDeepEqual(shown, lastLeftoverOnly);
});

test("hide first uncovered leftover buyer is distinct from first leftover-only, last leftover-only, first unserved, and winner-allocated", () => {
  const scenario = tertiaryFillFixture();
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
  assert.equal(firstUncoveredLeftover.includes("B05"), false);
  assert.equal(firstUncoveredLeftover.includes("B03"), true);
  assert.equal(firstLeftoverOnly.includes("B03"), false);
  assert.equal(lastLeftoverOnly.includes("B07"), false);
  assert.equal(firstWinnerAllocated.includes("B01"), false);
  assert.equal(lastWinnerAllocated.includes("B02"), false);
  assert.notDeepEqual(firstUncoveredLeftover, firstLeftoverOnly);
  assert.notDeepEqual(firstUncoveredLeftover, lastLeftoverOnly);
  assert.notDeepEqual(firstUncoveredLeftover, lastUnserved);
  assert.notDeepEqual(firstUncoveredLeftover, firstWinnerAllocated);
  assert.notDeepEqual(firstUncoveredLeftover, lastWinnerAllocated);
  assert.notDeepEqual(firstUncoveredLeftover, leftoverFill);
  assert.notDeepEqual(firstUncoveredLeftover, leftoverOnly);
  assert.notDeepEqual(firstUncoveredLeftover, leftover);
  assert.notDeepEqual(firstUncoveredLeftover, unserved);
  assert.notDeepEqual(firstUncoveredLeftover, winnerAllocated);
  assert.notDeepEqual(firstUncoveredLeftover, included);
  assert.notDeepEqual(firstUncoveredLeftover, firstTertiary);
  assert.notDeepEqual(firstUncoveredLeftover, lastTertiary);
  assert.notDeepEqual(firstUncoveredLeftover, lastLeftoverFill);
  assert.notDeepEqual(firstUncoveredLeftover, filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, false));
  assert.notEqual(filterBuyerIdsHidingFirstUncoveredLeftoverBuyer.name, filterBuyerIdsHidingFirstLeftoverOnlyBuyer.name);
  assert.notEqual(filterBuyerIdsHidingFirstUncoveredLeftoverBuyer.name, filterBuyerIdsHidingLastLeftoverOnlyBuyer.name);
  assert.notEqual(filterBuyerIdsHidingFirstUncoveredLeftoverBuyer.name, filterBuyerIdsHidingFirstUnservedBuyer.name);
  assert.notEqual(filterBuyerIdsHidingFirstUncoveredLeftoverBuyer.name, filterBuyerIdsHidingFirstWinnerAllocatedBuyer.name);
  assert.notEqual(filterBuyerIdsHidingFirstUncoveredLeftoverBuyer.name, filterBuyerIdsHidingLastWinnerAllocatedBuyer.name);
  assert.notEqual(filterBuyerIdsHidingFirstUncoveredLeftoverBuyer.name, filterBuyerIdsHidingFullyFilled.name);
  assert.notEqual("hideFirstUncoveredLeftoverBuyer", "hideFirstLeftoverOnlyBuyer");
  assert.notEqual("hideFirstUncoveredLeftoverBuyer", "hideLastLeftoverOnlyBuyer");
  assert.notEqual("hideFirstUncoveredLeftoverBuyer", "hideFirstUnservedBuyer");
  assert.notEqual("hideFirstUncoveredLeftoverBuyer", "hideFirstWinnerAllocatedBuyer");
  assert.notEqual("hideFirstUncoveredLeftoverBuyer", "hideLastWinnerAllocatedBuyer");
});

test("leftover fixture leftover-only hide is distinct from uncovered leftover hide when leftover fill covers leftover buyers", () => {
  const scenario = leftoverFixture();
  const original = scenario.buyers.map((buyer) => buyer.id);
  const coverage = computeResidualCoverage(scenario);
  assert.ok(coverage.leftoverBuyerCount > 0);
  assert.equal(coverage.unfilledBuyerCount, 0);
  const uncovered = filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true);
  assert.deepEqual(uncovered, original);
  assert.equal(leftoverOnly.includes("B03"), false);
  assert.notDeepEqual(uncovered, leftoverOnly);
});

test("hide first uncovered leftover buyer keeps every buyer when leftover after the winner is missing", () => {
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
  assert.deepEqual(filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, true), original);
});

test("hide first uncovered leftover buyer rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(scenario, 1), ScenarioError);
});

test("the organizer hide first uncovered leftover buyer filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-first-uncovered-leftover-buyer"/u);
  assert.match(buyerPanel, /Hide the first uncovered leftover buyer/u);
  assert.match(buyerPanel, /id="hide-first-leftover-only-buyer"/u);
  assert.match(buyerPanel, /id="hide-first-winner-allocated-buyer"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-first-uncovered-leftover-buyer"), false);
  assert.equal(merchantPanel.includes("hideFirstUncoveredLeftoverBuyer"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-count"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingFirstUncoveredLeftoverBuyer\(/u);
  assert.match(app, /hideFirstUncoveredLeftoverBuyer/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /hide-first-uncovered-leftover-buyer, and hide-last-uncovered-leftover-buyer choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
