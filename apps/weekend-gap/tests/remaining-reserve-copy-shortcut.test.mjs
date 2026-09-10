import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard z is wired to copy remaining-reserve Markdown through the existing control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-remaining-reserve"/);
  assert.match(html, /<kbd>Z<\/kbd>/);
  assert.match(html, /Copy remaining reserve at the selected hour as Markdown/);
  assert.match(app, /function copyRemainingReserveMarkdown/);
  assert.match(app, /remainingReserveAtHourToMarkdown\(scenario, selectedHour\)/);
  assert.match(app, /event\.key === "z"/);
  assert.match(app, /function copyHoursToClearMarkdown/);
  assert.match(app, /function copySelectedGanttHourMarkdown/);
  assert.notEqual(app.match(/function copyRemainingReserveMarkdown/)?.[0], app.match(/function copyHoursToClearMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyRemainingReserveMarkdown/)?.[0], app.match(/function copySelectedGanttHourMarkdown/)?.[0]);
});
