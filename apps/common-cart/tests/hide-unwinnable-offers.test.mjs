import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  evaluateMarket,
  filterOfferIdsHidingUnwinnable
} from "../src/model.js";

test("hide unwinnable offers is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("neighbourhood");
  const original = scenario.offers.map((offer) => offer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const shown = filterOfferIdsHidingUnwinnable(scenario, true);
  const all = filterOfferIdsHidingUnwinnable(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(shown.includes(winnerId));
  assert.equal(shown.every((id) => market.results.find((result) => result.offer.id === id).qualifies), true);
  const locked = market.results.filter((result) => !result.qualifies).map((result) => result.offer.id);
  for (const id of locked) assert.equal(shown.includes(id), false);
  assert.deepEqual(scenario.offers.map((offer) => offer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("hide unwinnable offers rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterOfferIdsHidingUnwinnable(scenario, "true"), /true or false/);
  assert.throws(() => filterOfferIdsHidingUnwinnable(scenario, 1), ScenarioError);
});

test("the hide-unwinnable filter is display only and does not leak buyer rows to merchants", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(merchantPanel, /id="hide-unwinnable-offers"/u);
  assert.match(merchantPanel, /Hide offers that cannot currently win/u);
  assert.match(merchantPanel, /id="restore-unwinnable-offers"/u);
  assert.match(merchantPanel, /Restore unwinnable offers/u);
  assert.match(merchantPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("buyer-rows"), false);
  assert.equal(merchantPanel.includes("leftover-buyer-rows"), false);
  assert.match(app, /function applyOfferFulfillmentFilter\(/u);
  assert.match(app, /filterOfferIdsHidingUnwinnable\(/u);
  assert.match(app, /hideUnwinnableOffers/u);
  assert.match(app, /#restore-unwinnable-offers/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
});
