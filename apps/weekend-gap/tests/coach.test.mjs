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

test("keyboard shortcuts skip inputs and cover help, play, first settlement, undo, redo and export", () => {
  assert.match(html, /id="shortcut-overlay"/);
  assert.match(html, /<kbd>\?<\/kbd>/);
  assert.match(html, /<kbd>J<\/kbd>/);
  assert.match(html, /Jump the timeline to the first settlement/);
  assert.match(html, /<kbd>D<\/kbd>/);
  assert.match(html, /Jump to the dashboard outcome summary/);
  assert.match(html, /<kbd>Q<\/kbd>/);
  assert.match(html, /Jump to the queue chart/);
  assert.match(html, /<kbd>G<\/kbd>/);
  assert.match(html, /Jump to the gate Gantt/);
  assert.match(html, /<kbd>P<\/kbd>/);
  assert.match(html, /Jump the timeline to the peak queue/);
  assert.match(appSource, /isEditableTarget/);
  assert.match(appSource, /event\.key === "\?"/);
  assert.match(appSource, /event\.key === " "/);
  assert.match(appSource, /event\.key === "j"/);
  assert.match(appSource, /jumpToFirstSettlement\(\)/);
  assert.match(appSource, /event\.key === "d"/);
  assert.match(appSource, /jumpToDashboard\(\)/);
  assert.match(appSource, /event\.key === "q"/);
  assert.match(appSource, /jumpToQueueChart\(\)/);
  assert.match(appSource, /event\.key === "g"/);
  assert.match(appSource, /jumpToGantt\(\)/);
  assert.match(appSource, /event\.key === "p"/);
  assert.match(appSource, /jumpToPeakQueue\(\)/);
  assert.match(appSource, /event\.key === "u"/);
  assert.match(appSource, /event\.key === "r"/);
  assert.match(appSource, /event\.key === "e"/);
  assert.match(appSource, /downloadScenario\(\)/);
});
