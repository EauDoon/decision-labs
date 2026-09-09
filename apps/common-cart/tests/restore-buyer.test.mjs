import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  createScenarioHistory,
  restoreRemovedBuyer,
  validateScenario
} from "../src/model.js";

test("restore removed buyer puts the same id back without mutating the source", () => {
  const scenario = clonePreset("neighbourhood");
  const removed = scenario.buyers[2];
  const remaining = { ...scenario, buyers: scenario.buyers.filter((buyer) => buyer.id !== removed.id) };
  const restored = restoreRemovedBuyer(remaining, removed);
  assert.equal(restored.buyers.length, scenario.buyers.length);
  assert.equal(restored.buyers.at(-1).id, removed.id);
  assert.equal(restored.buyers.at(-1).label, removed.label);
  assert.equal(remaining.buyers.length, scenario.buyers.length - 1);
  assert.throws(() => restoreRemovedBuyer(restored, removed), /already in the room/);
  validateScenario(restored);
});

test("restore removed buyer is undoable from history", () => {
  const scenario = clonePreset("studio");
  const removed = scenario.buyers[0];
  const remaining = { ...scenario, buyers: scenario.buyers.slice(1) };
  const history = createScenarioHistory(remaining);
  history.record(restoreRemovedBuyer(remaining, removed));
  assert.equal(history.current().buyers.some((buyer) => buyer.id === removed.id), true);
  assert.equal(history.undo().buyers.some((buyer) => buyer.id === removed.id), false);
  assert.equal(history.redo().buyers.at(-1).id, removed.id);
});

test("restore removed buyer rejects missing buyers, extras, and prototype keys", () => {
  const scenario = clonePreset("pantry");
  scenario.buyers = scenario.buyers.slice(1);
  assert.throws(() => restoreRemovedBuyer(scenario, null), ScenarioError);
  assert.throws(() => restoreRemovedBuyer(scenario, { ...clonePreset("pantry").buyers[0], extra: true }), /unexpected field: extra/);
  assert.throws(() => restoreRemovedBuyer(scenario, { ...clonePreset("pantry").buyers[0], constructor: "x" }), /unexpected field: constructor/);
});

test("the buyer room can restore the last removed buyer from this session", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="restore-removed-buyer"/u);
  assert.match(html, /Restore last removed buyer/u);
  assert.match(app, /lastRemovedBuyer/u);
  assert.match(app, /restoreRemovedBuyer\(/u);
});
