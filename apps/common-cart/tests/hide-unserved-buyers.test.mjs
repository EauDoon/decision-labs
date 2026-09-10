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
  filterBuyerIdsHidingUnservedBuyers
} from "../src/model.js";

test("hide unserved buyers is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("choirFolders");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const coverage = computeResidualCoverage(scenario);
  const served = new Set(market.winner.selectedBuyerIds);
  for (const id of coverage.secondary?.selectedBuyerIds ?? []) served.add(id);
  for (const id of coverage.tertiary?.selectedBuyerIds ?? []) served.add(id);
  const shown = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const all = filterBuyerIdsHidingUnservedBuyers(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(shown.length < original.length);
  for (const id of shown) assert.equal(served.has(id), true);
  for (const id of original) {
    if (!served.has(id)) assert.equal(shown.includes(id), false);
  }
  assert.ok(shown.includes(market.winner.selectedBuyerIds[0]));
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("hide unserved buyers is distinct from leftover, fully filled, and excluded filters", () => {
  const scenario = clonePreset("choirFolders");
  const unserved = filterBuyerIdsHidingUnservedBuyers(scenario, true);
  const leftover = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const filled = filterBuyerIdsHidingFullyFilled(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.notDeepEqual(unserved, leftover);
  assert.notDeepEqual(unserved, filled);
  assert.notDeepEqual(unserved, included);
  assert.notDeepEqual(unserved, filterBuyerIdsHidingUnservedBuyers(scenario, false));
  const neighbourhood = clonePreset("neighbourhood");
  assert.notDeepEqual(
    filterBuyerIdsHidingUnservedBuyers(neighbourhood, true),
    filterBuyerIdsHidingFullyFilled(neighbourhood, true)
  );
});

test("hide unserved buyers hides every buyer when no winner unlocks", () => {
  const scenario = clonePreset("studio");
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.equal(evaluateMarket(scenario).winner, null);
  assert.deepEqual(filterBuyerIdsHidingUnservedBuyers(scenario, true), []);
  assert.deepEqual(computeResidualCoverage(scenario).leftoverBuyerIds, original);
});

test("hide unserved buyers rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingUnservedBuyers(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingUnservedBuyers(scenario, 1), ScenarioError);
});

test("the organizer hide-unserved-buyers filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-unserved-buyers"/u);
  assert.match(buyerPanel, /Hide buyers with zero allocated units after the winner/u);
  assert.match(buyerPanel, /id="hide-buyers-with-leftover"/u);
  assert.match(buyerPanel, /id="hide-fully-filled-buyers"/u);
  assert.match(buyerPanel, /id="hide-excluded-buyers"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-unserved-buyers"), false);
  assert.equal(merchantPanel.includes("hideUnservedBuyers"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingUnservedBuyers\(/u);
  assert.match(app, /hideUnservedBuyers/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
