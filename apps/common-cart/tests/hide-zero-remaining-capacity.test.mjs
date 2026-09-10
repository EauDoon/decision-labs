import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  evaluateMarket,
  filterOfferIdsHidingUnwinnable,
  filterOfferIdsHidingZeroRemainingCapacity,
  validateScenario
} from "../src/model.js";

test("hide zero remaining capacity offers is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("neighbourhood");
  const original = scenario.offers.map((offer) => offer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const shown = filterOfferIdsHidingZeroRemainingCapacity(scenario, true);
  const all = filterOfferIdsHidingZeroRemainingCapacity(scenario, false);
  assert.deepEqual(all, original);
  assert.ok(shown.includes(winnerId));
  const remaining = market.winner.offer.capacity - market.winner.fulfilledUnits;
  assert.ok(remaining > 0);
  const locked = market.results.filter((result) => !result.qualifies).map((result) => result.offer.id);
  for (const id of locked) assert.equal(shown.includes(id), false);
  const qualifyingWithRoom = market.results
    .filter((result) => result.qualifies && result.offer.capacity - result.fulfilledUnits > 0)
    .map((result) => result.offer.id);
  assert.deepEqual(shown, qualifyingWithRoom);
  assert.deepEqual(scenario.offers.map((offer) => offer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("hide zero remaining capacity offers hides a fully filled winner", () => {
  const source = clonePreset("neighbourhood");
  const market = evaluateMarket(source);
  const winner = source.offers.find((offer) => offer.id === market.winner.offer.id);
  winner.capacity = market.winner.fulfilledUnits;
  const scenario = validateScenario(source);
  const next = evaluateMarket(scenario);
  assert.equal(next.winner.offer.id, market.winner.offer.id);
  assert.equal(next.winner.offer.capacity - next.winner.fulfilledUnits, 0);
  const shown = filterOfferIdsHidingZeroRemainingCapacity(scenario, true);
  assert.equal(shown.includes(next.winner.offer.id), false);
  assert.equal(filterOfferIdsHidingUnwinnable(scenario, true).includes(next.winner.offer.id), true);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, next.winner.fulfilledUnits);
});

test("hide zero remaining capacity offers rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterOfferIdsHidingZeroRemainingCapacity(scenario, "true"), /true or false/);
  assert.throws(() => filterOfferIdsHidingZeroRemainingCapacity(scenario, 1), ScenarioError);
});

test("the hide-zero-remaining-capacity filter is display only and does not leak buyer rows to merchants", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(merchantPanel, /id="hide-zero-remaining-capacity-offers"/u);
  assert.match(merchantPanel, /Hide offers with no remaining capacity after the winner/u);
  assert.match(merchantPanel, /id="restore-zero-remaining-capacity-offers"/u);
  assert.match(merchantPanel, /Restore remaining-capacity offers/u);
  assert.match(merchantPanel, /id="hide-unwinnable-offers"/u);
  assert.match(merchantPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("buyer-rows"), false);
  assert.equal(merchantPanel.includes("leftover-buyer-rows"), false);
  assert.match(app, /function applyOfferFulfillmentFilter\(/u);
  assert.match(app, /filterOfferIdsHidingZeroRemainingCapacity\(/u);
  assert.match(app, /hideZeroRemainingCapacityOffers/u);
  assert.match(app, /#restore-zero-remaining-capacity-offers/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
});
