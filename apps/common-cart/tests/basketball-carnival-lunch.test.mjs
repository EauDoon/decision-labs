import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clonePreset, computeResidualCoverage, evaluateMarket, validateScenario } from "../src/model.js";

test("basketball carnival lunch leftover fill is hall pickup and stays distinct from tennis carnival lunch", () => {
  const basketball = evaluateMarket(clonePreset("basketballCarnivalLunch"));
  const tennis = evaluateMarket(clonePreset("tennisCarnivalLunch"));
  assert.ok(basketball.winner);
  assert.equal(basketball.scenario.title, "Basketball carnival lunch");
  assert.notEqual(basketball.scenario.title, tennis.scenario.title);
  assert.notDeepEqual(clonePreset("basketballCarnivalLunch"), clonePreset("tennisCarnivalLunch"));
  const leftoverFill = computeResidualCoverage(basketball.scenario).secondary;
  assert.ok(leftoverFill);
  assert.equal(leftoverFill.merchant, "Hall Basketball Pickup");
  assert.equal(basketball.scenario.offers.find((offer) => offer.id === leftoverFill.offerId).fulfillment, "pickup");
  assert.ok(basketball.results.some((result) => result.offer.merchant === "Court-side Basketball Delivery" && result.offer.fulfillment === "shipping"));
  const first = evaluateMarket(clonePreset("basketballCarnivalLunch"));
  const second = evaluateMarket(validateScenario(clonePreset("basketballCarnivalLunch")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("the example bar includes basketball carnival lunch next to tennis carnival lunch", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="basketballCarnivalLunch"/u);
  assert.match(html, /Basketball carnival/u);
  assert.match(html, /data-preset="tennisCarnivalLunch"/u);
});
