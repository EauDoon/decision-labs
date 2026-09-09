import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, createScenarioHistory, validateWorkspace, duplicateEntry, compareScenarios } from "../src/model.js";

test("history detaches states, caps memory, and truncates branches", () => {
  const s = clonePreset(); const h = createScenarioHistory(s);
  h.record(s); assert.equal(h.canUndo, false);
  s.title = "A"; h.record(s); s.title = "B"; h.record(s);
  assert.equal(h.undo().title, "A"); assert.ok(h.canRedo);
  s.title = "C"; h.record(s); assert.equal(h.canRedo, false);
  const copy = h.current(); copy.title = "Mutated";
  assert.equal(h.current().title, "C");
  for (let i = 0; i < 60; i++) { s.title = `Room ${i}`; h.record(s); }
  let count = 0; while (h.canUndo) { h.undo(); count++; }
  assert.equal(count, 49);
  assert.throws(() => h.record({}));
});

test("comparison distinguishes changed demand, currency and missing allocations", () => {
  const before = clonePreset(); const after = clonePreset();
  assert.ok(compareScenarios(before, after).sameDemand);
  after.buyers[0].quantity++;
  after.currency = "USD";
  after.offers.forEach(o => { o.deliveryDays = 365; });
  const comparison = compareScenarios(before, after);
  assert.equal(comparison.sameDemand, false);
  assert.equal(comparison.sameCurrency, false);
  assert.equal(comparison.current.cost, null);
});

test("duplicate gives a unique id and independent nested constraints", () => {
  const s = clonePreset("tiers");
  const buyers = duplicateEntry(s, "buyers", s.buyers[0].id);
  assert.equal(new Set(buyers.buyers.map(b => b.id)).size, buyers.buyers.length);
  buyers.buyers.at(-1).allowedVariants.push("Changed");
  assert.notDeepEqual(buyers.buyers.at(-1).allowedVariants, buyers.buyers[0].allowedVariants);
  const offers = duplicateEntry(s, "offers", s.offers[0].id);
  assert.equal(offers.offers.length, s.offers.length + 1);
  assert.throws(() => duplicateEntry(s, "__proto__", s.buyers[0].id));
  assert.throws(() => duplicateEntry(s, "buyers", "missing"));
});

test("workspace validates every room and rejects unsupported schema or oversized collections", () => {
  const s = clonePreset();
  const workspace = validateWorkspace({ version: 1, rooms: [s] });
  s.title = "Changed";
  assert.notEqual(workspace.rooms[0].title, s.title);
  for (const invalid of [{ version: 2, rooms: [] }, { version: 1, rooms: [{}] }, { version: 1, rooms: Array(13).fill(s) }, { version: 1, rooms: [], extra: true }]) {
    assert.throws(() => validateWorkspace(invalid));
  }
});
