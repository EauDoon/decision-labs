import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard 7 is wired to the hide-weekend-issuer-open Gantt filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-issuer-open"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>7<\/kbd>/);
  assert.match(html, /Jump to the hide-weekend-issuer-open Gantt filter/);
  assert.match(html, /id="gantt-hide-weekend-issuer-open"[^>]*aria-keyshortcuts="7"/);
  assert.match(app, /function jumpToHideWeekendIssuerOpenFilter/);
  assert.match(app, /#gantt-hide-weekend-issuer-open/);
  assert.match(app, /event\.key === "7"/);
  assert.match(app, /event\.key === "`"/);
  assert.match(app, /function jumpToHideIssuerOpenFilter/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToHideWeekendIssuerOpenFilter/)?.[0], app.match(/function jumpToHideIssuerOpenFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideWeekendIssuerOpenFilter/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "7"') !== handler.indexOf('event.key === "`"'));
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "7"'), handler.indexOf('event.key === "7"') + 180), /copyLastOpenIssuerHourMarkdown/);
});
