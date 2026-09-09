import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clonePreset,
  duplicateRoom,
  uniqueCopyTitle,
  validateScenario,
  validateWorkspace
} from "../src/model.js";

test("duplicate room copies the scenario with a unique title suffix", () => {
  const source = clonePreset("neighbourhood");
  const copy = duplicateRoom(source);
  assert.equal(copy.title, "Neighbourhood coffee run (copy)");
  assert.notEqual(copy.title, source.title);
  assert.equal(source.title, "Neighbourhood coffee run");
  assert.deepEqual(copy.buyers, source.buyers);
  copy.buyers[0].label = "Mutated";
  assert.equal(source.buyers[0].label, "North block");
  validateScenario(copy);
});

test("duplicate room title stays within 80 characters and skips taken names", () => {
  const long = "A".repeat(80);
  const titled = uniqueCopyTitle(long, []);
  assert.ok(titled.length <= 80);
  assert.match(titled, / \(copy\)$/);
  const second = uniqueCopyTitle("Studio chairs", ["Studio chairs", "Studio chairs (copy)"]);
  assert.equal(second, "Studio chairs (copy 2)");
  const copy = duplicateRoom(clonePreset("studio"), ["Shared studio chairs (copy)"]);
  assert.equal(copy.title, "Shared studio chairs (copy 2)");
});

test("duplicate room can be stored as a compare snapshot", () => {
  const room = clonePreset("hardware");
  const copy = duplicateRoom(room, []);
  const workspace = validateWorkspace({ version: 1, rooms: [room, copy] });
  assert.equal(workspace.rooms.length, 2);
  assert.notEqual(workspace.rooms[0].title, workspace.rooms[1].title);
});

test("duplicate room rejects non-array titles and prototype-like misuse", () => {
  assert.throws(() => uniqueCopyTitle("Room", { constructor: ["Room"] }), /must be an array/);
  assert.throws(() => duplicateRoom(clonePreset("pantry"), "__proto__"), /must be an array/);
});

test("the workspace can duplicate the open room as a snapshot", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="duplicate-room"/u);
  assert.match(html, /Duplicate room as snapshot/u);
  assert.match(app, /duplicateRoom\(/u);
});
