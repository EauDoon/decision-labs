import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard greater-than is wired to the hide-zero-queue Gantt filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-zero-queue"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>&gt;<\/kbd>/);
  assert.match(html, /Jump to the hide-zero-queue Gantt filter/);
  assert.match(app, /function jumpToHideZeroQueueFilter/);
  assert.match(app, /#gantt-hide-zero-queue/);
  assert.match(app, /event\.key === ">"/);
  assert.match(app, /function jumpToGantt/);
  assert.match(app, /function jumpToFirstClosedBankCopy/);
  assert.notEqual(app.match(/function jumpToHideZeroQueueFilter/)?.[0], app.match(/function jumpToGantt/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideZeroQueueFilter/)?.[0], app.match(/function jumpToFirstClosedBankCopy/)?.[0]);
});
