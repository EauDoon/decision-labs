import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard ampersand is wired to the first-open-bank-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-bank"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>&amp;<\/kbd>/);
  assert.match(html, /Jump to the first-open-bank-hour copy control/);
  assert.match(app, /function jumpToFirstOpenBankCopy/);
  assert.match(app, /#copy-first-open-bank/);
  assert.ok(app.includes('event.key === "&"'));
  assert.ok(app.includes('event.key === ")"'));
  assert.match(app, /function jumpToFirstOpenFxCopy/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToFirstOpenBankCopy/)?.[0], app.match(/function jumpToFirstOpenFxCopy/)?.[0]);
  assert.notEqual(app.match(/function jumpToFirstOpenBankCopy/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const ampersandFn = app.slice(app.indexOf("function jumpToFirstOpenBankCopy"), app.indexOf("function jumpToHideZeroQueueFilter"));
  assert.match(ampersandFn, /jumpToGantt\(\)/);
  assert.doesNotMatch(ampersandFn, /copyFirstOpenBankHourMarkdown/);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "&"') !== handler.indexOf('event.key === ")"'));
  assert.match(handler, /jumpToFirstOpenBankCopy\(\)/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "&"'), handler.indexOf('event.key === "&"') + 180), /copyFirstOpenBankHourMarkdown/);
});
