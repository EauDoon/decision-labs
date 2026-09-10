import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard comma is wired to copy hours-to-first-settlement Markdown through the existing control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-hours-to-first-settlement"/);
  assert.match(html, /<kbd>,<\/kbd>/);
  assert.match(html, /Copy hours to first settlement as Markdown/);
  assert.match(app, /function copyHoursToFirstSettlementMarkdown/);
  assert.match(app, /hoursToFirstSettlementToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === ","/);
  assert.match(app, /copyHoursToFirstSettlementMarkdown\(\)/);
  assert.match(app, /function copyHoursToClearMarkdown/);
  assert.notEqual(app.match(/function copyHoursToFirstSettlementMarkdown/)?.[0], app.match(/function copyHoursToClearMarkdown/)?.[0]);
});
