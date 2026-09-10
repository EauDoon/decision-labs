import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  computeResidualCoverage,
  evaluateMarket,
  filterBuyerIdsHidingExcluded,
  filterBuyerIdsHidingFullyFilled
} from "../src/model.js";

test("hide fully filled buyers is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("neighbourhood");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const leftover = new Set(computeResidualCoverage(scenario).leftoverBuyerIds);
  const shown = filterBuyerIdsHidingFullyFilled(scenario, true);
  const all = filterBuyerIdsHidingFullyFilled(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(shown.length < original.length);
  for (const id of shown) assert.equal(leftover.has(id), true);
  for (const id of market.winner.selectedBuyerIds) assert.equal(shown.includes(id), false);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("hide fully filled buyers is distinct from hide excluded buyers", () => {
  const scenario = clonePreset("neighbourhood");
  const leftover = filterBuyerIdsHidingFullyFilled(scenario, true);
  const included = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  assert.notDeepEqual(leftover, included);
  assert.notDeepEqual(leftover, filterBuyerIdsHidingFullyFilled(scenario, false));
});

test("hide fully filled buyers shows every leftover buyer when no winner unlocks", () => {
  const scenario = clonePreset("studio");
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.equal(evaluateMarket(scenario).winner, null);
  assert.deepEqual(filterBuyerIdsHidingFullyFilled(scenario, true), original);
  assert.deepEqual(computeResidualCoverage(scenario).leftoverBuyerIds, original);
});

test("hide fully filled buyers rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingFullyFilled(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingFullyFilled(scenario, 1), ScenarioError);
});

test("the organizer hide-fully-filled filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-fully-filled-buyers"/u);
  assert.match(buyerPanel, /Hide buyers with no leftover after the winner/u);
  assert.match(buyerPanel, /id="hide-excluded-buyers"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-fully-filled-buyers"), false);
  assert.equal(merchantPanel.includes("hideFullyFilledBuyers"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingFullyFilled\(/u);
  assert.match(app, /hideFullyFilledBuyers/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
});
