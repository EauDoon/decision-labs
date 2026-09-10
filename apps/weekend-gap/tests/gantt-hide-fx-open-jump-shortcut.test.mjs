import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard percent is wired to the hide-FX-open Gantt filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-fx-open"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>%<\/kbd>/);
  assert.match(html, /Jump to the hide-FX-open Gantt filter/);
  assert.match(html, /id="gantt-hide-fx-open"[^>]*aria-keyshortcuts="%"/);
  assert.match(app, /function jumpToHideFxOpenFilter/);
  assert.match(app, /#gantt-hide-fx-open/);
  assert.match(app, /event\.key === "%"/);
  assert.match(app, /event\.key === "#"/);
  assert.match(app, /function jumpToHidePayoutOpenFilter/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToHideFxOpenFilter/)?.[0], app.match(/function jumpToHidePayoutOpenFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideFxOpenFilter/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "%"') !== handler.indexOf('event.key === "#"'));
});
