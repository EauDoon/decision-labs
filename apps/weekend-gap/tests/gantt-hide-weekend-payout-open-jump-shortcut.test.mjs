import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard ArrowUp is wired to the hide-weekend-payout-open Gantt filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-payout-open"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>ArrowUp<\/kbd>/);
  assert.match(html, /Jump to the hide-weekend-payout-open Gantt filter/);
  assert.match(html, /id="gantt-hide-weekend-payout-open"[^>]*aria-keyshortcuts="ArrowUp"/);
  assert.match(app, /function jumpToHideWeekendPayoutOpenFilter/);
  assert.match(app, /#gantt-hide-weekend-payout-open/);
  assert.match(app, /event\.key === "ArrowUp"/);
  assert.match(app, /event\.key === "End"/);
  assert.match(app, /event\.key === "Home"/);
  assert.match(app, /function jumpToHideWeekendBankOpenFilter/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToHideWeekendPayoutOpenFilter/)?.[0], app.match(/function jumpToHideWeekendBankOpenFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideWeekendPayoutOpenFilter/)?.[0], app.match(/function jumpToHidePayoutOpenFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideWeekendPayoutOpenFilter/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "ArrowUp"') !== handler.indexOf('event.key === "End"'));
  assert.ok(handler.indexOf('event.key === "ArrowUp"') !== handler.indexOf('event.key === "Home"'));
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "ArrowUp"'), handler.indexOf('event.key === "ArrowUp"') + 180), /copyLastOpenPayoutHourMarkdown/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "ArrowUp"'), handler.indexOf('event.key === "ArrowUp"') + 180), /copyLastOpenBankHourMarkdown/);
});
