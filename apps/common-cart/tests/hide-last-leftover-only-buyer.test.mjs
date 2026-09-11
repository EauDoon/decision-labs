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
  filterBuyerIdsHidingFirstUnservedBuyer,
  filterBuyerIdsHidingLastBuyerFilledByLeftoverFill,
  filterBuyerIdsHidingLastBuyerFilledByTertiaryFill,
  filterBuyerIdsHidingLastLeftoverOnlyBuyer,
  filterBuyerIdsHidingLastUnservedBuyer,
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

test("hide last leftover-only buyer is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("hockeyCarnivalLunch");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const shown = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  const all = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, false);
  assert.deepEqual(all, original);
  assert.equal(shown.includes("B04"), false);
  assert.ok(shown.includes("B03"));
  assert.ok(shown.length < original.length);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("winner-allocated, leftover-fill, tertiary-fill, unserved, and other leftover-only buyers stay visible when hiding the last leftover-only buyer", () => {
  const scenario = tertiaryFillFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = market.winner.selectedBuyerIds;
  const leftoverFillIds = coverage.secondary?.selectedBuyerIds ?? [];
  const tertiaryIds = coverage.tertiary?.selectedBuyerIds ?? [];
  const shown = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  const leftoverOnlyAll = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  assert.equal(shown.includes("B07"), false);
  assert.equal(shown.includes("B06"), true);
  assert.equal(shown.includes("B03"), true);
  assert.equal(shown.includes("B04"), true);
  assert.equal(shown.includes("B05"), true);
  assert.equal(shown.includes("B08"), true);
  assert.equal(leftoverOnlyAll.includes("B03"), false);
  assert.equal(leftoverOnlyAll.includes("B07"), false);
  for (const id of leftoverFillIds) {
    if (id !== "B07") assert.equal(shown.includes(id), true);
  }
  for (const id of winnerIds) assert.equal(shown.includes(id), true);
  for (const id of tertiaryIds) {
    if (id !== "B07") assert.equal(shown.includes(id), true);
  }
  assert.notDeepEqual(shown, leftoverOnlyAll);
});

test("hide last leftover-only buyer is distinct from last unserved, first unserved, leftover-only-all, leftover-fill, and tertiary-fill filters", () => {
  const scenario = tertiaryFillFixture();
  const lastLeftoverOnly = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  const lastUnserved = filterBuyerIdsHidingLastUnservedBuyer(scenario, true);
  const firstUnserved = filterBuyerIdsHidingFirstUnservedBuyer(scenario, true);
  const lastTertiary = filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, true);
  const firstTertiary = filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, true);
  const firstLeftover = filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(scenario, true);
  const lastLeftoverFill = filterBuyerIdsHidingLastBuyerFilledByLeftoverFill(scenario, true);
  const leftoverFill = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const winnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.equal(lastLeftoverOnly.includes("B07"), false);
  assert.equal(lastLeftoverOnly.includes("B08"), true);
  assert.equal(lastUnserved.includes("B08"), false);
  assert.equal(lastUnserved.includes("B07"), true);
  assert.equal(firstUnserved.includes("B05"), false);
  assert.equal(lastTertiary.includes("B07"), false);
  assert.equal(lastLeftoverFill.includes("B04"), false);
  assert.equal(lastLeftoverFill.includes("B07"), true);
  assert.notDeepEqual(lastLeftoverOnly, lastUnserved);
  assert.notDeepEqual(lastLeftoverOnly, firstUnserved);
  assert.notDeepEqual(lastLeftoverOnly, firstTertiary);
  assert.notDeepEqual(lastLeftoverOnly, firstLeftover);
  assert.notDeepEqual(lastLeftoverOnly, lastLeftoverFill);
  assert.notDeepEqual(lastLeftoverOnly, leftoverFill);
  assert.notDeepEqual(lastLeftoverOnly, leftoverOnly);
  assert.notDeepEqual(lastLeftoverOnly, leftover);
  assert.notDeepEqual(lastLeftoverOnly, unserved);
  assert.notDeepEqual(lastLeftoverOnly, winnerAllocated);
  assert.notDeepEqual(lastLeftoverOnly, included);
  assert.notDeepEqual(lastLeftoverOnly, filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, false));
  assert.notEqual(filterBuyerIdsHidingLastLeftoverOnlyBuyer.name, filterBuyerIdsHidingLeftoverOnlyBuyers.name);
  assert.notEqual(filterBuyerIdsHidingLastLeftoverOnlyBuyer.name, filterBuyerIdsHidingLastUnservedBuyer.name);
  assert.notEqual("hideLastLeftoverOnlyBuyer", "hideLeftoverOnlyBuyers");
  assert.notEqual("hideLastLeftoverOnlyBuyer", "hideLastUnservedBuyer");
  assert.notEqual("hideLastLeftoverOnlyBuyer", "hideFirstUnservedBuyer");
});

test("hide last leftover-only buyer keeps every buyer when leftover-only buyers are missing", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers.forEach((buyer) => {
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 40;
    buyer.latestDeliveryDays = 30;
  });
  scenario.offers = [{ ...scenario.offers[0], variant: "Medium roast", minimumUnits: 1, capacity: 5000, deliveryDays: 1 }];
  const original = scenario.buyers.map((buyer) => buyer.id);
  const coverage = computeResidualCoverage(scenario);
  assert.ok(evaluateMarket(scenario).winner);
  assert.equal(coverage.unfilledBuyerCount, 0);
  assert.deepEqual(filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true), original);
});

test("hide last leftover-only buyer rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, 1), ScenarioError);
});

test("the organizer hide last leftover-only buyer filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-last-leftover-only-buyer"/u);
  assert.match(buyerPanel, /Hide the last leftover-only buyer/u);
  assert.match(buyerPanel, /id="hide-leftover-only-buyers"/u);
  assert.match(buyerPanel, /id="hide-last-unserved-buyer"/u);
  assert.match(buyerPanel, /id="hide-first-unserved-buyer"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-last-leftover-only-buyer"), false);
  assert.equal(merchantPanel.includes("hideLastLeftoverOnlyBuyer"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-remaining"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingLastLeftoverOnlyBuyer\(/u);
  assert.match(app, /hideLastLeftoverOnlyBuyer/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /hide-first-unserved-buyer, hide-last-leftover-only-buyer, hide-first-leftover-only-buyer, hide-last-winner-allocated-buyer, and hide-first-winner-allocated-buyer choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
