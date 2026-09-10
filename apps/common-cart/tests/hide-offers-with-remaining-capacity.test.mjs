import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  evaluateMarket,
  filterOfferIdsHidingOffersWithRemainingCapacity,
  filterOfferIdsHidingUnwinnable,
  filterOfferIdsHidingZeroRemainingCapacity,
  validateScenario
} from "../src/model.js";

test("hide offers with remaining capacity is display-only and leaves matching unchanged", () => {
  const scenario = clonePreset("neighbourhood");
  const original = scenario.offers.map((offer) => offer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const remaining = market.winner.offer.capacity - market.winner.fulfilledUnits;
  assert.ok(remaining > 0);
  const shown = filterOfferIdsHidingOffersWithRemainingCapacity(scenario, true);
  const all = filterOfferIdsHidingOffersWithRemainingCapacity(scenario, false);
  assert.deepEqual(all, original);
  assert.equal(shown.includes(winnerId), false);
  const withRoom = market.results
    .filter((result) => result.offer.capacity - result.fulfilledUnits > 0)
    .map((result) => result.offer.id);
  for (const id of withRoom) assert.equal(shown.includes(id), false);
  const zeroRemaining = market.results
    .filter((result) => result.offer.capacity - result.fulfilledUnits === 0)
    .map((result) => result.offer.id);
  assert.deepEqual(shown, zeroRemaining);
  assert.deepEqual(scenario.offers.map((offer) => offer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
});

test("hide offers with remaining capacity is the inverse of hide zero remaining capacity on remaining units", () => {
  const scenario = clonePreset("neighbourhood");
  const original = scenario.offers.map((offer) => offer.id);
  const withRoom = filterOfferIdsHidingZeroRemainingCapacity(scenario, true);
  const zeroRoom = filterOfferIdsHidingOffersWithRemainingCapacity(scenario, true);
  assert.notDeepEqual(withRoom, zeroRoom);
  assert.equal(withRoom.some((id) => zeroRoom.includes(id)), false);
  for (const id of withRoom) assert.equal(zeroRoom.includes(id), false);
  const market = evaluateMarket(scenario);
  for (const result of market.results) {
    const remaining = result.offer.capacity - result.fulfilledUnits;
    if (remaining > 0) assert.equal(zeroRoom.includes(result.offer.id), false);
    if (remaining === 0) assert.equal(zeroRoom.includes(result.offer.id), true);
  }
  assert.notDeepEqual(zeroRoom, filterOfferIdsHidingOffersWithRemainingCapacity(scenario, false));
  assert.notDeepEqual(zeroRoom, filterOfferIdsHidingUnwinnable(scenario, true));
  assert.deepEqual(filterOfferIdsHidingOffersWithRemainingCapacity(scenario, false), original);
});

test("hide offers with remaining capacity shows a fully filled winner", () => {
  const source = clonePreset("neighbourhood");
  const market = evaluateMarket(source);
  const winner = source.offers.find((offer) => offer.id === market.winner.offer.id);
  winner.capacity = market.winner.fulfilledUnits;
  const scenario = validateScenario(source);
  const next = evaluateMarket(scenario);
  assert.equal(next.winner.offer.id, market.winner.offer.id);
  assert.equal(next.winner.offer.capacity - next.winner.fulfilledUnits, 0);
  const shown = filterOfferIdsHidingOffersWithRemainingCapacity(scenario, true);
  assert.equal(shown.includes(next.winner.offer.id), true);
  assert.equal(filterOfferIdsHidingZeroRemainingCapacity(scenario, true).includes(next.winner.offer.id), false);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, next.winner.fulfilledUnits);
});

test("hide offers with remaining capacity rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterOfferIdsHidingOffersWithRemainingCapacity(scenario, "true"), /true or false/);
  assert.throws(() => filterOfferIdsHidingOffersWithRemainingCapacity(scenario, 1), ScenarioError);
});

test("the hide-offers-with-remaining-capacity filter is display only and does not leak buyer rows to merchants", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(merchantPanel, /id="hide-offers-with-remaining-capacity"/u);
  assert.match(merchantPanel, /Hide offers whose remaining capacity after the winner is greater than zero/u);
  assert.match(merchantPanel, /id="restore-offers-with-remaining-capacity"/u);
  assert.match(merchantPanel, /Restore remaining-capacity-positive offers/u);
  assert.match(merchantPanel, /id="hide-zero-remaining-capacity-offers"/u);
  assert.match(merchantPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("buyer-rows"), false);
  assert.equal(merchantPanel.includes("leftover-buyer-rows"), false);
  assert.match(app, /function applyOfferFulfillmentFilter\(/u);
  assert.match(app, /filterOfferIdsHidingOffersWithRemainingCapacity\(/u);
  assert.match(app, /hideOffersWithRemainingCapacity/u);
  assert.match(app, /#restore-offers-with-remaining-capacity/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
});

test("hide offers with remaining capacity jump stays on the merchant offers filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(merchantPanel, /id="hide-offers-with-remaining-capacity"/u);
  assert.match(merchantPanel, /id="offers-list"/u);
  assert.match(app, /function focusHideOffersWithRemainingCapacity\(/u);
  assert.match(app, /#hide-offers-with-remaining-capacity/u);
  assert.match(app, /#offers-list/u);
  assert.match(app, /#merchant-tab/u);
  assert.match(app, /if \(key === "\{"\)/u);
  assert.doesNotMatch(app, /if \(key === "\{"\) \{\s*event\.preventDefault\(\);\s*focusHideBuyersWithLeftover/u);
  assert.match(app, /if \(key === "="\) \{\s*event\.preventDefault\(\);\s*focusHideBuyersWithLeftover\(\);/u);
});
