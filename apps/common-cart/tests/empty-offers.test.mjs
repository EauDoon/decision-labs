import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  createScenarioHistory,
  evaluateMarket,
  restoreExampleOffers,
  validateScenario
} from "../src/model.js";

test("an empty offer list is valid and unlocks nothing", () => {
  const scenario = clonePreset("neighbourhood");
  const buyerIds = scenario.buyers.map((buyer) => buyer.id);
  scenario.offers = [];
  const clean = validateScenario(scenario);
  assert.equal(clean.offers.length, 0);
  assert.deepEqual(clean.buyers.map((buyer) => buyer.id), buyerIds);
  const market = evaluateMarket(clean);
  assert.equal(market.winner, null);
  assert.equal(market.results.length, 0);
  assert.equal(market.buyerCount, 5);
});

test("restoring example offers keeps buyers and is undoable", () => {
  const empty = clonePreset("studio");
  const buyerIds = empty.buyers.map((buyer) => buyer.id);
  const labels = empty.buyers.map((buyer) => buyer.label);
  empty.offers = [];
  const history = createScenarioHistory(empty);
  const restored = restoreExampleOffers(history.current(), "neighbourhood");
  assert.equal(restored.offers.length, 3);
  assert.equal(restored.offers[0].merchant, "Harbour Roasters");
  assert.deepEqual(restored.buyers.map((buyer) => buyer.id), buyerIds);
  assert.deepEqual(restored.buyers.map((buyer) => buyer.label), labels);
  assert.equal(restored.title, "Shared studio chairs");
  history.record(restored);
  assert.equal(history.undo().offers.length, 0);
  assert.deepEqual(history.current().buyers.map((buyer) => buyer.label), labels);
  assert.equal(history.redo().offers[0].merchant, "Harbour Roasters");
  validateScenario(restored);
});

test("restore example offers rejects unknown presets and extras", () => {
  const scenario = clonePreset("pantry");
  scenario.offers = [];
  assert.throws(() => restoreExampleOffers(scenario, "missing"), /Unknown preset/);
  assert.throws(() => restoreExampleOffers(scenario, "__proto__"), ScenarioError);
  assert.throws(() => restoreExampleOffers(scenario, "constructor"), ScenarioError);
  assert.equal(scenario.offers.length, 0);
});

test("the merchant table has an honest empty-offer recovery", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="empty-offer-recovery"/u);
  assert.match(html, /Restore example offers/u);
  assert.match(html, /This room has no offers/u);
  assert.match(html, /Buyers stay in place/u);
  assert.match(app, /restoreExampleOffers\(/u);
  assert.match(app, /Example offers restored\. Buyers were left unchanged/u);
  assert.doesNotMatch(app, /A room needs at least one offer/u);
});
