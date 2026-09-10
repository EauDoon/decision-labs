import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard semicolon is wired to copy hours-to-clear Markdown through the existing control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-hours-to-clear"/);
  assert.match(html, /<kbd>;<\/kbd>/);
  assert.match(html, /Copy hours to clear as Markdown/);
  assert.match(app, /function copyHoursToClearMarkdown/);
  assert.match(app, /hoursToClearQueueToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === ";"/);
  assert.match(app, /copyHoursToClearMarkdown\(\)/);
  assert.match(app, /function copyHoursToFirstSettlementMarkdown/);
  assert.notEqual(app.match(/function copyHoursToClearMarkdown/)?.[0], app.match(/function copyHoursToFirstSettlementMarkdown/)?.[0]);
});
