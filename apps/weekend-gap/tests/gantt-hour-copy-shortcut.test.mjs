import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard c is wired to copy the selected Gantt hour Markdown", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /<kbd>C<\/kbd>/);
  assert.match(html, /Copy the selected Gantt hour as Markdown/);
  assert.match(app, /function copySelectedGanttHourMarkdown/);
  assert.match(app, /selectedGanttHourToMarkdown\(scenario, selectedHour\)/);
  assert.match(app, /event\.key === "c"/);
});
