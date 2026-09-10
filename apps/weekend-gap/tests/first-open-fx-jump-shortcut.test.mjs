import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard close-paren is wired to the first-open-FX-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-fx"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>\)<\/kbd>/);
  assert.match(html, /Jump to the first-open-FX-hour copy control/);
  assert.match(app, /function jumpToFirstOpenFxCopy/);
  assert.match(app, /#copy-first-open-fx/);
  assert.ok(app.includes('event.key === ")"'));
  assert.ok(app.includes('event.key === "!"'));
  assert.match(app, /function jumpToFirstOpenPayoutCopy/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToFirstOpenFxCopy/)?.[0], app.match(/function jumpToFirstOpenPayoutCopy/)?.[0]);
  assert.notEqual(app.match(/function jumpToFirstOpenFxCopy/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const parenFn = app.slice(app.indexOf("function jumpToFirstOpenFxCopy"), app.indexOf("function jumpToHideZeroQueueFilter"));
  assert.match(parenFn, /jumpToGantt\(\)/);
  assert.doesNotMatch(parenFn, /copyFirstOpenFxHourMarkdown/);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === ")"') !== handler.indexOf('event.key === "!"'));
  assert.match(handler, /jumpToFirstOpenFxCopy\(\)/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === ")"'), handler.indexOf('event.key === ")"') + 180), /copyFirstOpenFxHourMarkdown/);
});
