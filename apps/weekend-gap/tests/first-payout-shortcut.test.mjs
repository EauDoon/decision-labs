import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard n is wired to the first-payout Gantt marker", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-first-payout-marker"/);
  assert.match(html, /<kbd>N<\/kbd>/);
  assert.match(html, /Jump to the first-payout Gantt marker/);
  assert.match(app, /function jumpToFirstPayoutMarker/);
  assert.match(app, /#gantt-first-payout-marker/);
  assert.match(app, /event\.key === "n"/);
  assert.match(app, /nextPayoutHour/);
  assert.match(app, /return jumpToGantt\(\)/);
});
