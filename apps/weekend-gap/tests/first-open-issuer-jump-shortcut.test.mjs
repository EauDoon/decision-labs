import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard caret is wired to the first-open-issuer-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-issuer"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>\^<\/kbd>/);
  assert.match(html, /Jump to the first-open-issuer-hour copy control/);
  assert.match(app, /function jumpToFirstOpenIssuerCopy/);
  assert.match(app, /#copy-first-open-issuer/);
  assert.ok(app.includes('event.key === "^"'));
  assert.ok(app.includes('event.key === "&"'));
  assert.match(app, /function jumpToFirstOpenBankCopy/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToFirstOpenIssuerCopy/)?.[0], app.match(/function jumpToFirstOpenBankCopy/)?.[0]);
  assert.notEqual(app.match(/function jumpToFirstOpenIssuerCopy/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const caretFn = app.slice(app.indexOf("function jumpToFirstOpenIssuerCopy"), app.indexOf("function jumpToHideZeroQueueFilter"));
  assert.match(caretFn, /jumpToGantt\(\)/);
  assert.doesNotMatch(caretFn, /copyFirstOpenIssuerHourMarkdown/);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "^"') !== handler.indexOf('event.key === "&"'));
  assert.match(handler, /jumpToFirstOpenIssuerCopy\(\)/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "^"'), handler.indexOf('event.key === "^"') + 180), /copyFirstOpenIssuerHourMarkdown/);
});
