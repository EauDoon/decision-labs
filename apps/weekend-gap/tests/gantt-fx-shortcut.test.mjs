import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard w is wired to the FX Gantt row and is distinct from Bank", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-fx-row"/);
  assert.match(html, /<kbd>W<\/kbd>/);
  assert.match(html, /Jump to the FX Gantt row/);
  assert.match(app, /function jumpToGanttFxRow/);
  assert.match(app, /#gantt-fx-row/);
  assert.match(app, /event\.key === "w"/);
  assert.match(app, /gateFilter !== "all" && gateFilter !== "fx"/);
  assert.match(app, /function jumpToGanttBankRow/);
  assert.notEqual(app.match(/function jumpToGanttFxRow/)?.[0], app.match(/function jumpToGanttBankRow/)?.[0]);
});
