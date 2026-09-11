import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard 3 is wired to the hide-weekend-bank-closed Gantt filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-bank-closed"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>3<\/kbd>/);
  assert.match(html, /Jump to the hide-weekend-bank-closed Gantt filter/);
  assert.match(html, /id="gantt-hide-weekend-bank-closed"[^>]*aria-keyshortcuts="3"/);
  assert.match(app, /function jumpToHideWeekendBankClosedFilter/);
  assert.match(app, /#gantt-hide-weekend-bank-closed/);
  assert.match(app, /event\.key === "3"/);
  assert.match(app, /event\.key === "0"/);
  assert.match(app, /function jumpToHideWeekendIssuerClosedFilter/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToHideWeekendBankClosedFilter/)?.[0], app.match(/function jumpToHideWeekendIssuerClosedFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideWeekendBankClosedFilter/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "3"') !== handler.indexOf('event.key === "0"'));
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "3"'), handler.indexOf('event.key === "3"') + 180), /copyLastClosedBankHourMarkdown/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "3"'), handler.indexOf('event.key === "3"') + 180), /copyLastClosedIssuerHourMarkdown/);
});
