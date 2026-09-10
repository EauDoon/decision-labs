import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard h is wired to the selected Gantt hour row", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hour-row"/);
  assert.match(html, /<kbd>H<\/kbd>/);
  assert.match(html, /Jump to the selected Gantt hour/);
  assert.match(app, /function jumpToSelectedGanttHour/);
  assert.match(app, /#gantt-hour-row/);
  assert.match(app, /event\.key === "h"/);
});
