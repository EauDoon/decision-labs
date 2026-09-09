import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, createScenarioHistory, validateWorkspace } from "../src/model.js";

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

test("workspace validates every room and rejects unsupported schema or oversized collections", () => {
  const s = clonePreset();
  const workspace = validateWorkspace({ version: 1, rooms: [s] });
  s.title = "Changed";
  assert.notEqual(workspace.rooms[0].title, s.title);
  for (const invalid of [{ version: 2, rooms: [] }, { version: 1, rooms: [{}] }, { version: 1, rooms: Array(13).fill(s) }, { version: 1, rooms: [], extra: true }]) {
    assert.throws(() => validateWorkspace(invalid));
  }
});
