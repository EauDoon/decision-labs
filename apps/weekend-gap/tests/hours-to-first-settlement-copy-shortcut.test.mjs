import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard l is wired to copy hours-to-first-settlement Markdown", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /<kbd>L<\/kbd>/);
  assert.match(html, /Copy hours to first settlement as Markdown/);
  assert.match(app, /function copyHoursToFirstSettlementMarkdown/);
  assert.match(app, /hoursToFirstSettlementToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "l"/);
  assert.match(app, /function copyHoursToClearMarkdown/);
  assert.notEqual(app.match(/function copyHoursToFirstSettlementMarkdown/)?.[0], app.match(/function copyHoursToClearMarkdown/)?.[0]);
});
