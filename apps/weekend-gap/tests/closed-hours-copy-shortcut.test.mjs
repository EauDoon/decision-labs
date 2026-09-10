import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard x is wired to copy the closed-hours Markdown", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /<kbd>X<\/kbd>/);
  assert.match(html, /Copy closed hours as Markdown/);
  assert.match(app, /function copyClosedHoursMarkdown/);
  assert.match(app, /closedGanttHoursToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "x"/);
});
