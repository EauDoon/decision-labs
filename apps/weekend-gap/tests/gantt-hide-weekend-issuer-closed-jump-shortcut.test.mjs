import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard 0 is wired to the hide-weekend-issuer-closed Gantt filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-issuer-closed"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>0<\/kbd>/);
  assert.match(html, /Jump to the hide-weekend-issuer-closed Gantt filter/);
  assert.match(html, /id="gantt-hide-weekend-issuer-closed"[^>]*aria-keyshortcuts="0"/);
  assert.match(app, /function jumpToHideWeekendIssuerClosedFilter/);
  assert.match(app, /#gantt-hide-weekend-issuer-closed/);
  assert.match(app, /event\.key === "0"/);
  assert.match(app, /event\.key === "7"/);
  assert.match(app, /event\.key === "`"/);
  assert.match(app, /function jumpToHideWeekendIssuerOpenFilter/);
  assert.match(app, /function jumpToHideIssuerOpenFilter/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToHideWeekendIssuerClosedFilter/)?.[0], app.match(/function jumpToHideWeekendIssuerOpenFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideWeekendIssuerClosedFilter/)?.[0], app.match(/function jumpToHideIssuerOpenFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideWeekendIssuerClosedFilter/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "0"') !== handler.indexOf('event.key === "7"'));
  assert.ok(handler.indexOf('event.key === "0"') !== handler.indexOf('event.key === "`"'));
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "0"'), handler.indexOf('event.key === "0"') + 180), /copyLastClosedIssuerHourMarkdown/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "0"'), handler.indexOf('event.key === "0"') + 180), /copyLastOpenIssuerHourMarkdown/);
});
