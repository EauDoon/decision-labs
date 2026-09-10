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
  filterBuyerIdsHidingFullyFilled
} from "../src/model.js";

test("hide buyers with leftover is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("neighbourhood");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const leftover = new Set(computeResidualCoverage(scenario).leftoverBuyerIds);
  const shown = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const all = filterBuyerIdsHidingBuyersWithLeftover(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(shown.length < original.length);
  for (const id of shown) assert.equal(leftover.has(id), false);
  for (const id of leftover) assert.equal(shown.includes(id), false);
  for (const id of market.winner.selectedBuyerIds) assert.equal(shown.includes(id), true);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("hide buyers with leftover is the inverse of hide fully filled buyers", () => {
  const scenario = clonePreset("neighbourhood");
  const leftover = filterBuyerIdsHidingFullyFilled(scenario, true);
  const filled = filterBuyerIdsHidingBuyersWithLeftover(scenario, true);
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.notDeepEqual(leftover, filled);
  assert.deepEqual([...leftover, ...filled].sort(), [...original].sort());
  assert.equal(leftover.some((id) => filled.includes(id)), false);
  assert.notDeepEqual(filled, filterBuyerIdsHidingBuyersWithLeftover(scenario, false));
  const choir = clonePreset("choirFolders");
  const choirFilled = filterBuyerIdsHidingBuyersWithLeftover(choir, true);
  const choirIncluded = filterBuyerIdsHidingExcluded(choir, "O01", true);
  assert.notDeepEqual(choirFilled, choirIncluded);
});

test("hide buyers with leftover hides every buyer when no winner unlocks", () => {
  const scenario = clonePreset("studio");
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const original = scenario.buyers.map((buyer) => buyer.id);
  assert.equal(evaluateMarket(scenario).winner, null);
  assert.deepEqual(filterBuyerIdsHidingBuyersWithLeftover(scenario, true), []);
  assert.deepEqual(computeResidualCoverage(scenario).leftoverBuyerIds, original);
});

test("hide buyers with leftover rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingBuyersWithLeftover(scenario, "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingBuyersWithLeftover(scenario, 1), ScenarioError);
});

test("the organizer hide-buyers-with-leftover filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-buyers-with-leftover"/u);
  assert.match(buyerPanel, /Hide buyers that still have leftover after the winner/u);
  assert.match(buyerPanel, /id="hide-fully-filled-buyers"/u);
  assert.match(buyerPanel, /id="hide-excluded-buyers"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-buyers-with-leftover"), false);
  assert.equal(merchantPanel.includes("hideBuyersWithLeftover"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingBuyersWithLeftover\(/u);
  assert.match(app, /hideBuyersWithLeftover/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /Older workspace files without them still show every buyer/u);
  assert.match(app, /function focusHideBuyersWithLeftover\(/u);
  assert.match(app, /#hide-buyers-with-leftover/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(key === "="\)/u);
});
