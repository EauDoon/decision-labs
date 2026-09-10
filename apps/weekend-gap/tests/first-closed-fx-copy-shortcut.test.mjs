import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard period is wired to the first-closed-FX-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-fx"/);
  assert.match(html, /<kbd>\.<\/kbd>/);
  assert.match(html, /Jump to the first-closed-FX-hour copy control/);
  assert.match(app, /function jumpToFirstClosedFxCopy/);
  assert.match(app, /#copy-first-closed-fx/);
  assert.match(app, /event\.key === "\."/);
  assert.match(app, /function jumpToGanttFxRow/);
  assert.match(app, /function jumpToDashboard/);
  assert.notEqual(app.match(/function jumpToFirstClosedFxCopy/)?.[0], app.match(/function jumpToGanttFxRow/)?.[0]);
  assert.notEqual(app.match(/function jumpToFirstClosedFxCopy/)?.[0], app.match(/function jumpToDashboard/)?.[0]);
});
