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

function twoUnservedSoccer() {
  const scenario = clonePreset("soccerCarnivalLunch");
  const template = scenario.buyers[0];
  scenario.buyers.push({
    ...template,
    id: "B07",
    label: "Kit stall",
    category: "Soccer merch pack",
    quantity: 5,
    maxUnitPrice: 12,
    latestDeliveryDays: 4,
    allowedVariants: ["Soccer scarf"]
  });
  return validateScenario(scenario);
}

test("hide first unserved buyer is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("soccerCarnivalLunch");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const shown = filterBuyerIdsHidingFirstUnservedBuyer(scenario, true);
  const all = filterBuyerIdsHidingFirstUnservedBuyer(scenario, false);
  assert.deepEqual(all, original);
  assert.equal(shown.includes("B06"), false);
  assert.ok(shown.length < original.length);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("winner-allocated, leftover-fill, tertiary-fill, and other unserved buyers stay visible when hiding the first unserved buyer", () => {
  const scenario = twoUnservedSoccer();
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = market.winner.selectedBuyerIds;
  const leftoverFillIds = coverage.secondary?.selectedBuyerIds ?? [];
  const shown = filterBuyerIdsHidingFirstUnservedBuyer(scenario, true);
  const lastUnserved = filterBuyerIdsHidingLastUnservedBuyer(scenario, true);
  const unservedAll = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  assert.equal(shown.includes("B06"), false);
  assert.equal(shown.includes("B07"), true);
  assert.equal(lastUnserved.includes("B07"), false);
  assert.equal(lastUnserved.includes("B06"), true);
  assert.equal(unservedAll.includes("B06"), false);
  assert.equal(unservedAll.includes("B07"), false);
  for (const id of leftoverFillIds) assert.equal(shown.includes(id), true);
  for (const id of winnerIds) assert.equal(shown.includes(id), true);
  assert.notDeepEqual(shown, lastUnserved);
  assert.notDeepEqual(shown, unservedAll);
});

test("hide first unserved buyer is distinct from last unserved, last tertiary-fill, unserved-all, leftover-fill, leftover-only, leftover, and winner-allocated filters", () => {
  const scenario = tertiaryFillFixture();
  const firstUnserved = filterBuyerIdsHidingFirstUnservedBuyer(scenario, true);
  const lastUnserved = filterBuyerIdsHidingLastUnservedBuyer(scenario, true);
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
  assert.notDeepEqual(firstUnserved, lastUnserved);
  assert.notDeepEqual(firstUnserved, lastTertiary);
  assert.notDeepEqual(firstUnserved, firstTertiary);
  assert.notDeepEqual(firstUnserved, firstLeftover);
  assert.notDeepEqual(firstUnserved, lastOnly);
  assert.notDeepEqual(firstUnserved, leftoverFill);
  assert.notDeepEqual(firstUnserved, leftoverOnly);
  assert.notDeepEqual(firstUnserved, leftover);
  assert.notDeepEqual(firstUnserved, unserved);
  assert.notDeepEqual(firstUnserved, winnerAllocated);
  assert.notDeepEqual(firstUnserved, included);
  assert.notDeepEqual(firstUnserved, filterBuyerIdsHidingFirstUnservedBuyer(scenario, false));
  assert.notEqual(filterBuyerIdsHidingFirstUnservedBuyer.name, filterBuyerIdsHidingLastUnservedBuyer.name);
  assert.notEqual(filterBuyerIdsHidingFirstUnservedBuyer.name, filterBuyerIdsHidingUnservedBuyers.name);
  assert.notEqual("hideFirstUnservedBuyer", "hideLastUnservedBuyer");
  assert.notEqual("hideFirstUnservedBuyer", "hideUnservedBuyers");
});

test("hide first unserved buyer keeps every buyer when every buyer is served", () => {
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
  assert.deepEqual(filterBuyerIdsHidingFirstUnservedBuyer(scenario, true), original);
});

test("hide first unserved buyer rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingFirstUnservedBuyer(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingFirstUnservedBuyer(scenario, 1), ScenarioError);
});

test("the organizer unserved edge select is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="edge-unserved"/u);
  assert.match(buyerPanel, /Show all/u);
  assert.match(buyerPanel, /Hide first and last/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("edge-unserved"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /edgeUnserved/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /edge-leftover-fill, edge-tertiary-fill, edge-unserved, edge-leftover-only, edge-winner-allocated, and edge-uncovered-leftover choices are kept/u);
  assert.match(html, /retired first\/last checkbox pairs map onto the matching edge select/u);
});
