import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard 9 is wired to the last-closed-issuer-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-issuer"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>9<\/kbd>/);
  assert.match(html, /Jump to the last-closed-issuer-hour copy control/);
  assert.match(app, /function jumpToLastClosedIssuerCopy/);
  assert.match(app, /#copy-last-closed-issuer/);
  assert.ok(app.includes('event.key === "9"'));
  assert.ok(app.includes('event.key === "6"'));
  assert.match(app, /function jumpToLastOpenIssuerCopy/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToLastClosedIssuerCopy/)?.[0], app.match(/function jumpToLastOpenIssuerCopy/)?.[0]);
  assert.notEqual(app.match(/function jumpToLastClosedIssuerCopy/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const nineFn = app.slice(app.indexOf("function jumpToLastClosedIssuerCopy"), app.indexOf("function jumpToHideWeekendIssuerClosedFilter"));
  assert.match(nineFn, /jumpToGantt\(\)/);
  assert.doesNotMatch(nineFn, /copyLastClosedIssuerHourMarkdown/);
  assert.doesNotMatch(nineFn, /copyLastOpenIssuerHourMarkdown/);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "9"') !== handler.indexOf('event.key === "6"'));
  assert.match(handler, /jumpToLastClosedIssuerCopy\(\)/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "9"'), handler.indexOf('event.key === "9"') + 180), /copyLastClosedIssuerHourMarkdown/);
});
