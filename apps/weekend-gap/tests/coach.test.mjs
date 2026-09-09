import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("first-run coach is dismissible, skippable on share links, and keyboard closable", () => {
  assert.match(html, /id="coach-overlay"/);
  assert.match(html, /id="coach-dismiss"/);
  assert.match(html, /synthetic 72-hour study/);
  assert.match(html, /Three gates must overlap/);
  assert.match(html, /Friday 15:00 to Monday 15:00/);
  assert.match(appSource, /weekend-gap:coach:v1/);
  assert.match(appSource, /hash\.startsWith\("#scenario="\)/);
  assert.match(appSource, /event\.key === "Escape"/);
  assert.match(appSource, /#coach-dismiss/);
});

test("first-run coach can be replayed from help and the method section", () => {
  assert.match(html, /id="coach-replay"/);
  assert.match(html, /id="coach-replay-method"/);
  assert.match(appSource, /function replayCoach/);
  assert.match(appSource, /#coach-replay/);
  assert.match(appSource, /#coach-replay-method/);
});

test("keyboard shortcuts skip inputs and cover help, play, undo, redo and export", () => {
  assert.match(html, /id="shortcut-overlay"/);
  assert.match(html, /<kbd>\?<\/kbd>/);
  assert.match(appSource, /isEditableTarget/);
  assert.match(appSource, /event\.key === "\?"/);
  assert.match(appSource, /event\.key === " "/);
  assert.match(appSource, /event\.key === "u"/);
  assert.match(appSource, /event\.key === "r"/);
  assert.match(appSource, /event\.key === "e"/);
  assert.match(appSource, /downloadScenario\(\)/);
});
