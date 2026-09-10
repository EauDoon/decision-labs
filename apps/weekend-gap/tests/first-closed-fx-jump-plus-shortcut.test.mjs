import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard plus is wired to the first-closed-FX-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-fx"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>\+<\/kbd>/);
  assert.match(html, /Jump to the first-closed-FX-hour copy control/);
  assert.match(app, /function jumpToFirstClosedFxCopyOrGantt/);
  assert.match(app, /#copy-first-closed-fx/);
  assert.ok(app.includes('event.key === "+"'));
  assert.ok(app.includes('event.key === "="'));
  assert.ok(app.includes('event.key === "_"'));
  assert.match(app, /function jumpToFirstClosedPayoutCopy/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToFirstClosedFxCopyOrGantt/)?.[0], app.match(/function jumpToFirstClosedPayoutCopy/)?.[0]);
  assert.notEqual(app.match(/function jumpToFirstClosedFxCopyOrGantt/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  const plusFn = app.slice(app.indexOf("function jumpToFirstClosedFxCopyOrGantt"), app.indexOf("function copyFirstClosedFxHourMarkdown"));
  assert.match(plusFn, /jumpToGantt\(\)/);
  assert.doesNotMatch(plusFn, /copyFirstClosedFxHourMarkdown/);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "+"') !== handler.indexOf('event.key === "="'));
  assert.ok(handler.indexOf('event.key === "+"') !== handler.indexOf('event.key === "_"'));
  assert.match(handler, /jumpToFirstClosedFxCopyOrGantt\(\)/);
  assert.doesNotMatch(handler.slice(handler.indexOf('event.key === "+"'), handler.indexOf('event.key === "+"') + 180), /copyFirstClosedFxHourMarkdown/);
});
