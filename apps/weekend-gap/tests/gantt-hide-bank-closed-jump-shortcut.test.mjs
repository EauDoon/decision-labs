import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard equals is wired to the hide-bank-closed Gantt filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-bank-closed"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>=<\/kbd>/);
  assert.match(html, /Jump to the hide-bank-closed Gantt filter/);
  assert.match(html, /id="gantt-hide-bank-closed"[^>]*aria-keyshortcuts="="/);
  assert.match(app, /function jumpToHideBankClosedFilter/);
  assert.match(app, /#gantt-hide-bank-closed/);
  assert.match(app, /event\.key === "="/);
  assert.match(app, /event\.key === ">"/);
  assert.match(app, /function jumpToHideZeroQueueFilter/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToHideBankClosedFilter/)?.[0], app.match(/function jumpToHideZeroQueueFilter/)?.[0]);
  assert.notEqual(app.match(/function jumpToHideBankClosedFilter/)?.[0], app.match(/function jumpToGantt/)?.[0]);
});
