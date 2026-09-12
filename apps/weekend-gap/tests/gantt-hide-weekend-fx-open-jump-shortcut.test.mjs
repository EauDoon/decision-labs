import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard ArrowLeft is wired to the hide-weekend-FX-open Gantt filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-fx-open"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>ArrowLeft<\/kbd>/);
  assert.match(html, /Jump to the hide-weekend-FX-open Gantt filter/);
  assert.match(html, /id="gantt-hide-weekend-fx-open"[^>]*aria-keyshortcuts="ArrowLeft F12 Shift\+F12"/);
  assert.match(app, /function jumpToHideWeekendFxOpenFilter/);
  assert.match(app, /#gantt-hide-weekend-fx-open/);
  assert.match(app, /event\.key === "ArrowLeft"/);
  assert.match(app, /event\.key === "ArrowUp"/);
  assert.match(app, /event\.key === "End"/);
  assert.match(app, /function jumpToHideWeekendPayoutOpenFilter/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToHideWeekendFxOpenFilter/)?.[0], app.match(/function jumpToHideWeekendPayoutOpenFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideWeekendFxOpenFilter/)?.[0], app.match(/function jumpToHideFxOpenFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideWeekendFxOpenFilter/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "ArrowLeft"') !== handler.indexOf('event.key === "ArrowUp"'));
  assert.ok(handler.indexOf('event.key === "ArrowLeft"') !== handler.indexOf('event.key === "End"'));
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "ArrowLeft"'), handler.indexOf('event.key === "ArrowLeft"') + 180), /copyLastOpenFxHourMarkdown/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "ArrowLeft"'), handler.indexOf('event.key === "ArrowLeft"') + 180), /copyLastOpenPayoutHourMarkdown/);
});
