import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard b is wired to the Bank Gantt row", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-bank-row"/);
  assert.match(html, /<kbd>B<\/kbd>/);
  assert.match(html, /Jump to the Bank Gantt row/);
  assert.match(app, /function jumpToGanttBankRow/);
  assert.match(app, /#gantt-bank-row/);
  assert.match(app, /event\.key === "b"/);
  assert.match(app, /gateFilter !== "all" && gateFilter !== "bank"/);
});
