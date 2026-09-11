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

test("hide first leftover-only buyer is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("hockeyCarnivalLunch");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const shown = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true);
  const all = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, false);
  const lastLeftoverOnly = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  assert.deepEqual(all, original);
  assert.equal(shown.includes("B03"), false);
  assert.equal(shown.includes("B04"), true);
  assert.equal(lastLeftoverOnly.includes("B04"), false);
  assert.equal(lastLeftoverOnly.includes("B03"), true);
  assert.ok(shown.length < original.length);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("baseball carnival lunch leftover-only ids match hockey leftover-only order", () => {
  const hockey = clonePreset("hockeyCarnivalLunch");
  const baseball = clonePreset("baseballCarnivalLunch");
  const hockeyFirst = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(hockey, true);
  const hockeyLast = filterBuyerIdsHidingLastLeftoverOnlyBuyer(hockey, true);
  const baseballFirst = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(baseball, true);
  const baseballLast = filterBuyerIdsHidingLastLeftoverOnlyBuyer(baseball, true);
  assert.equal(hockeyFirst.includes("B03"), false);
  assert.equal(hockeyFirst.includes("B04"), true);
  assert.equal(hockeyLast.includes("B04"), false);
  assert.equal(hockeyLast.includes("B03"), true);
  assert.equal(baseballFirst.includes("B03"), false);
  assert.equal(baseballFirst.includes("B04"), true);
  assert.equal(baseballLast.includes("B04"), false);
  assert.equal(baseballLast.includes("B03"), true);
});

test("winner-allocated, leftover-fill, tertiary-fill, unserved, and other leftover-only buyers stay visible when hiding the first leftover-only buyer", () => {
  const scenario = tertiaryFillFixture();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = market.winner.selectedBuyerIds;
  const leftoverFillIds = coverage.secondary?.selectedBuyerIds ?? [];
  const tertiaryIds = coverage.tertiary?.selectedBuyerIds ?? [];
  const shown = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true);
  const lastLeftoverOnly = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  const leftoverOnlyAll = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  assert.equal(shown.includes("B03"), false);
  assert.equal(shown.includes("B07"), true);
  assert.equal(shown.includes("B04"), true);
  assert.equal(shown.includes("B06"), true);
  assert.equal(shown.includes("B05"), true);
  assert.equal(shown.includes("B08"), true);
  assert.equal(lastLeftoverOnly.includes("B07"), false);
  assert.equal(lastLeftoverOnly.includes("B03"), true);
  assert.equal(leftoverOnlyAll.includes("B03"), false);
  assert.equal(leftoverOnlyAll.includes("B07"), false);
  for (const id of leftoverFillIds) {
    if (id !== "B03") assert.equal(shown.includes(id), true);
  }
  for (const id of winnerIds) assert.equal(shown.includes(id), true);
  for (const id of tertiaryIds) assert.equal(shown.includes(id), true);
  assert.notDeepEqual(shown, leftoverOnlyAll);
  assert.notDeepEqual(shown, lastLeftoverOnly);
});

test("hide first leftover-only buyer is distinct from last leftover-only, last leftover-fill, last unserved, and first unserved", () => {
  const scenario = tertiaryFillFixture();
  const firstLeftoverOnly = filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true);
  const lastLeftoverOnly = filterBuyerIdsHidingLastLeftoverOnlyBuyer(scenario, true);
  const lastUnserved = filterBuyerIdsHidingLastUnservedBuyer(scenario, true);
  const firstUnserved = filterBuyerIdsHidingFirstUnservedBuyer(scenario, true);
  const lastTertiary = filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(scenario, true);
  const firstTertiary = filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(scenario, true);
  const lastLeftoverFill = filterBuyerIdsHidingLastBuyerFilledByLeftoverFill(scenario, true);
  const leftoverFill = filterBuyerIdsHidingBuyersFilledByLeftoverFill(scenario, true);
  const leftoverOnly = filterBuyerIdsHidingLeftoverOnlyBuyers(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const winnerAllocated = filterBuyerIdsHidingWinnerAllocatedBuyers(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.equal(firstLeftoverOnly.includes("B03"), false);
  assert.equal(firstLeftoverOnly.includes("B07"), true);
  assert.equal(lastLeftoverOnly.includes("B07"), false);
  assert.equal(lastLeftoverOnly.includes("B03"), true);
  assert.equal(lastUnserved.includes("B08"), false);
  assert.equal(lastUnserved.includes("B07"), true);
  assert.equal(firstUnserved.includes("B05"), false);
  assert.equal(lastLeftoverFill.includes("B04"), false);
  assert.equal(lastLeftoverFill.includes("B07"), true);
  assert.equal(lastTertiary.includes("B07"), false);
  assert.notDeepEqual(firstLeftoverOnly, lastLeftoverOnly);
  assert.notDeepEqual(firstLeftoverOnly, lastUnserved);
  assert.notDeepEqual(firstLeftoverOnly, firstUnserved);
  assert.notDeepEqual(firstLeftoverOnly, lastLeftoverFill);
  assert.notDeepEqual(firstLeftoverOnly, leftoverFill);
  assert.notDeepEqual(firstLeftoverOnly, leftoverOnly);
  assert.notDeepEqual(firstLeftoverOnly, leftover);
  assert.notDeepEqual(firstLeftoverOnly, unserved);
  assert.notDeepEqual(firstLeftoverOnly, winnerAllocated);
  assert.notDeepEqual(firstLeftoverOnly, included);
  assert.notDeepEqual(firstLeftoverOnly, firstTertiary);
  assert.notDeepEqual(firstLeftoverOnly, filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, false));
  assert.notEqual(filterBuyerIdsHidingFirstLeftoverOnlyBuyer.name, filterBuyerIdsHidingLastLeftoverOnlyBuyer.name);
  assert.notEqual(filterBuyerIdsHidingFirstLeftoverOnlyBuyer.name, filterBuyerIdsHidingLeftoverOnlyBuyers.name);
  assert.notEqual("hideFirstLeftoverOnlyBuyer", "hideLastLeftoverOnlyBuyer");
  assert.notEqual("hideFirstLeftoverOnlyBuyer", "hideLeftoverOnlyBuyers");
  assert.notEqual("hideFirstLeftoverOnlyBuyer", "hideLastUnservedBuyer");
  assert.notEqual("hideFirstLeftoverOnlyBuyer", "hideFirstUnservedBuyer");
});

test("hide first leftover-only buyer keeps every buyer when leftover-only buyers are missing", () => {
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
  assert.deepEqual(filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, true), original);
});

test("hide first leftover-only buyer rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingFirstLeftoverOnlyBuyer(scenario, 1), ScenarioError);
});

test("the organizer hide first leftover-only buyer filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-first-leftover-only-buyer"/u);
  assert.match(buyerPanel, /Hide the first leftover-only buyer/u);
  assert.match(buyerPanel, /id="hide-last-leftover-only-buyer"/u);
  assert.match(buyerPanel, /id="hide-leftover-only-buyers"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-first-leftover-only-buyer"), false);
  assert.equal(merchantPanel.includes("hideFirstLeftoverOnlyBuyer"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-maximum"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingFirstLeftoverOnlyBuyer\(/u);
  assert.match(app, /hideFirstLeftoverOnlyBuyer/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /hide-last-leftover-only-buyer, hide-first-leftover-only-buyer, hide-last-winner-allocated-buyer, hide-first-winner-allocated-buyer, hide-first-uncovered-leftover-buyer, and hide-last-uncovered-leftover-buyer choices are kept/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
