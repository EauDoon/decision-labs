import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  applyOfferSort,
  clonePreset,
  createScenarioHistory,
  previewOfferSort,
  validateScenario
} from "../src/model.js";

test("preview offer sort reorders unit prices without changing ids or the saved room", () => {
  const scenario = clonePreset("neighbourhood");
  const originalIds = scenario.offers.map((offer) => offer.id);
  const originalPrices = scenario.offers.map((offer) => offer.unitPrice);
  const preview = previewOfferSort(scenario, "unitPrice");
  assert.deepEqual(preview.map((offer) => offer.unitPrice), [...originalPrices].sort((left, right) => left - right));
  assert.deepEqual(new Set(preview.map((offer) => offer.id)), new Set(originalIds));
  assert.deepEqual(scenario.offers.map((offer) => offer.id), originalIds);
  preview[0].merchant = "Mutated";
  assert.equal(scenario.offers[0].merchant, "Harbour Roasters");
});

test("capacity sort is high to low and keeps a stable id tie-break", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.offers[0].capacity = 16;
  scenario.offers[1].capacity = 16;
  const preview = previewOfferSort(scenario, "capacity");
  const capacities = preview.map((offer) => offer.capacity);
  assert.deepEqual(capacities, [...capacities].sort((left, right) => right - left));
  const tied = preview.filter((offer) => offer.capacity === 16);
  assert.deepEqual(tied.map((offer) => offer.id), [...tied.map((offer) => offer.id)].sort());
});

test("applied offer sort is undoable and does not rewrite ids", () => {
  const scenario = clonePreset("studio");
  const history = createScenarioHistory(scenario);
  const originalIds = scenario.offers.map((offer) => offer.id);
  const sorted = applyOfferSort(scenario, "unitPrice");
  assert.deepEqual(sorted.offers.map((offer) => offer.id).sort(), [...originalIds].sort());
  assert.notDeepEqual(sorted.offers.map((offer) => offer.id), originalIds);
  history.record(sorted);
  assert.deepEqual(history.undo().offers.map((offer) => offer.id), originalIds);
  assert.deepEqual(history.redo().offers.map((offer) => offer.unitPrice), applyOfferSort(scenario, "unitPrice").offers.map((offer) => offer.unitPrice));
  validateScenario(sorted);
});

test("offer sort rejects unknown modes and prototype keys", () => {
  const scenario = clonePreset("pantry");
  assert.throws(() => previewOfferSort(scenario, "__proto__"), ScenarioError);
  assert.throws(() => applyOfferSort(scenario, "constructor"), /unit price or capacity/);
  assert.throws(() => applyOfferSort(scenario, "id"), /unit price or capacity/);
});

test("the merchant table can preview and apply offer sort", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="offer-sort-mode"/u);
  assert.match(html, /id="preview-offer-sort"/u);
  assert.match(html, /id="apply-offer-sort"/u);
  assert.match(app, /applyOfferSort\(/u);
  assert.match(app, /previewOfferSort\(/u);
});
