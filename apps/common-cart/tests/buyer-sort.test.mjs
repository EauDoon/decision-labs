import test from "node:test";
import assert from "node:assert/strict";
import {
  ScenarioError,
  applyBuyerSort,
  clonePreset,
  createScenarioHistory,
  previewBuyerSort,
  validateScenario
} from "../src/model.js";

test("preview buyer sort reorders labels without changing ids or the saved room", () => {
  const scenario = clonePreset("neighbourhood");
  const originalIds = scenario.buyers.map((buyer) => buyer.id);
  const originalLabels = scenario.buyers.map((buyer) => buyer.label);
  const preview = previewBuyerSort(scenario, "label");
  assert.deepEqual(preview.map((buyer) => buyer.label), ["Garden row", "Library crew", "North block", "Station flats", "West court"]);
  assert.deepEqual(new Set(preview.map((buyer) => buyer.id)), new Set(originalIds));
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), originalIds);
  preview[0].label = "Mutated";
  assert.equal(scenario.buyers[0].label, originalLabels[0]);
});

test("quantity sort is high to low and keeps a stable id tie-break", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].quantity = 3;
  scenario.buyers[1].quantity = 3;
  const preview = previewBuyerSort(scenario, "quantity");
  const quantities = preview.map((buyer) => buyer.quantity);
  assert.deepEqual(quantities, [...quantities].sort((left, right) => right - left));
  const tied = preview.filter((buyer) => buyer.quantity === 3);
  assert.deepEqual(tied.map((buyer) => buyer.id), [...tied.map((buyer) => buyer.id)].sort());
});

test("applied buyer sort is undoable and does not rewrite ids", () => {
  const scenario = clonePreset("studio");
  const history = createScenarioHistory(scenario);
  const originalIds = scenario.buyers.map((buyer) => buyer.id);
  const sorted = applyBuyerSort(scenario, "label");
  assert.deepEqual(sorted.buyers.map((buyer) => buyer.id).sort(), [...originalIds].sort());
  assert.notDeepEqual(sorted.buyers.map((buyer) => buyer.id), originalIds);
  history.record(sorted);
  assert.deepEqual(history.undo().buyers.map((buyer) => buyer.id), originalIds);
  assert.deepEqual(history.redo().buyers.map((buyer) => buyer.label), applyBuyerSort(scenario, "label").buyers.map((buyer) => buyer.label));
  validateScenario(sorted);
});

test("buyer sort rejects unknown modes and prototype keys", () => {
  const scenario = clonePreset("pantry");
  assert.throws(() => previewBuyerSort(scenario, "__proto__"), ScenarioError);
  assert.throws(() => applyBuyerSort(scenario, "constructor"), /label or quantity/);
  assert.throws(() => applyBuyerSort(scenario, "id"), /label or quantity/);
});
