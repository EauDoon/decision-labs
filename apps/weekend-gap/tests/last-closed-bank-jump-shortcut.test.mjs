import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard 2 is wired to the last-closed-bank-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-bank"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>2<\/kbd>/);
  assert.match(html, /Jump to the last-closed-bank-hour copy control/);
  assert.match(app, /function jumpToLastClosedBankCopy/);
  assert.match(app, /#copy-last-closed-bank/);
  assert.ok(app.includes('event.key === "2"'));
  assert.ok(app.includes('event.key === "9"'));
  assert.match(app, /function jumpToLastClosedIssuerCopy/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToLastClosedBankCopy/)?.[0], app.match(/function jumpToLastClosedIssuerCopy/)?.[0]);
  assert.notEqual(app.match(/function jumpToLastClosedBankCopy/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const twoFn = app.slice(app.indexOf("function jumpToLastClosedBankCopy"), app.indexOf("function jumpToHideWeekendIssuerClosedFilter"));
  assert.match(twoFn, /jumpToGantt\(\)/);
  assert.doesNotMatch(twoFn, /copyLastClosedBankHourMarkdown/);
  assert.doesNotMatch(twoFn, /copyLastClosedIssuerHourMarkdown/);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "2"') !== handler.indexOf('event.key === "9"'));
  assert.match(handler, /jumpToLastClosedBankCopy\(\)/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "2"'), handler.indexOf('event.key === "2"') + 180), /copyLastClosedBankHourMarkdown/);
});
