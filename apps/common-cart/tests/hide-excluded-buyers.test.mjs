import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  evaluateMarket,
  filterBuyerIdsHidingExcluded
} from "../src/model.js";

test("hide excluded buyers is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("neighbourhood");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const winnerId = evaluateMarket(scenario).winner.offer.id;
  const shown = filterBuyerIdsHidingExcluded(scenario, "O01", true);
  const all = filterBuyerIdsHidingExcluded(scenario, "O01", false);
  assert.deepEqual(all, original);
  assert.deepEqual(shown, ["B01", "B02", "B03", "B05"]);
  assert.equal(shown.includes("B04"), false);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, 12);
});

test("hide excluded buyers rejects prototype-like flags and missing offers", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsHidingExcluded(scenario, "O01", "true"), /true or false/);
  assert.throws(() => filterBuyerIdsHidingExcluded(scenario, "", true), /existing offer/);
  assert.throws(() => filterBuyerIdsHidingExcluded(scenario, "missing", true), ScenarioError);
});

test("the organizer hide-excluded filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-excluded-buyers"/u);
  assert.match(buyerPanel, /Hide excluded buyers/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-excluded-buyers"), false);
  assert.match(app, /function applyBuyerDisplayFilters\(/u);
  assert.match(app, /filterBuyerIdsHidingExcluded\(/u);
  assert.match(app, /hideExcludedBuyers/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /Older workspace files without it still show every buyer/u);
});
