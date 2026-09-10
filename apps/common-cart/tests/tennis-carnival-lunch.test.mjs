import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clonePreset, computeResidualCoverage, evaluateMarket, validateScenario } from "../src/model.js";

test("tennis carnival lunch leftover fill is hall pickup and stays distinct from cricket carnival lunch", () => {
  const tennis = evaluateMarket(clonePreset("tennisCarnivalLunch"));
  const cricket = evaluateMarket(clonePreset("cricketCarnivalLunch"));
  assert.ok(tennis.winner);
  assert.equal(tennis.scenario.title, "Tennis carnival lunch");
  assert.notEqual(tennis.scenario.title, cricket.scenario.title);
  assert.notDeepEqual(clonePreset("tennisCarnivalLunch"), clonePreset("cricketCarnivalLunch"));
  const leftoverFill = computeResidualCoverage(tennis.scenario).secondary;
  assert.ok(leftoverFill);
  assert.equal(leftoverFill.merchant, "Hall Tennis Pickup");
  assert.equal(tennis.scenario.offers.find((offer) => offer.id === leftoverFill.offerId).fulfillment, "pickup");
  assert.ok(tennis.results.some((result) => result.offer.merchant === "Court-side Tennis Delivery" && result.offer.fulfillment === "shipping"));
  const first = evaluateMarket(clonePreset("tennisCarnivalLunch"));
  const second = evaluateMarket(validateScenario(clonePreset("tennisCarnivalLunch")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("the example bar includes tennis carnival lunch next to cricket carnival lunch", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="tennisCarnivalLunch"/u);
  assert.match(html, /Tennis carnival/u);
  assert.match(html, /data-preset="cricketCarnivalLunch"/u);
});
