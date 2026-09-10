import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard 6 is wired to the last-open-issuer-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-issuer"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>6<\/kbd>/);
  assert.match(html, /Jump to the last-open-issuer-hour copy control/);
  assert.match(app, /function jumpToLastOpenIssuerCopy/);
  assert.match(app, /#copy-last-open-issuer/);
  assert.ok(app.includes('event.key === "6"'));
  assert.ok(app.includes('event.key === "^"'));
  assert.match(app, /function jumpToFirstOpenIssuerCopy/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToLastOpenIssuerCopy/)?.[0], app.match(/function jumpToFirstOpenIssuerCopy/)?.[0]);
  assert.notEqual(app.match(/function jumpToLastOpenIssuerCopy/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const sixFn = app.slice(app.indexOf("function jumpToLastOpenIssuerCopy"), app.indexOf("function jumpToHideZeroQueueFilter"));
  assert.match(sixFn, /jumpToGantt\(\)/);
  assert.doesNotMatch(sixFn, /copyLastOpenIssuerHourMarkdown/);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "6"') !== handler.indexOf('event.key === "^"'));
  assert.match(handler, /jumpToLastOpenIssuerCopy\(\)/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "6"'), handler.indexOf('event.key === "6"') + 180), /copyLastOpenIssuerHourMarkdown/);
});
