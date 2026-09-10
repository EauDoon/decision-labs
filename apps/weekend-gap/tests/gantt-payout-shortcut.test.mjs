import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard o is wired to the Payout Gantt row and is distinct from first-payout N", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-payout-row"/);
  assert.match(html, /<kbd>O<\/kbd>/);
  assert.match(html, /Jump to the Payout Gantt row/);
  assert.match(app, /function jumpToGanttPayoutRow/);
  assert.match(app, /#gantt-payout-row/);
  assert.match(app, /event\.key === "o"/);
  assert.match(app, /gateFilter !== "all" && gateFilter !== "payout"/);
  assert.match(app, /function jumpToFirstPayoutMarker/);
  assert.notEqual(app.match(/function jumpToGanttPayoutRow/)?.[0], app.match(/function jumpToFirstPayoutMarker/)?.[0]);
});
