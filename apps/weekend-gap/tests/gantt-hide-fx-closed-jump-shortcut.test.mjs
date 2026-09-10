import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard at-sign is wired to the hide-FX-closed Gantt filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-fx-closed"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>@<\/kbd>/);
  assert.match(html, /Jump to the hide-FX-closed Gantt filter/);
  assert.match(html, /id="gantt-hide-fx-closed"[^>]*aria-keyshortcuts="@"/);
  assert.match(app, /function jumpToHideFxClosedFilter/);
  assert.match(app, /#gantt-hide-fx-closed/);
  assert.match(app, /event\.key === "@"/);
  assert.match(app, /event\.key === "\|"/);
  assert.match(app, /function jumpToHidePayoutClosedFilter/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToHideFxClosedFilter/)?.[0], app.match(/function jumpToHidePayoutClosedFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideFxClosedFilter/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "@"') !== handler.indexOf('event.key === "|"'));
});
