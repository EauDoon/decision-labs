import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard v is wired to copy selected versus peak-queue hour Markdown", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /<kbd>V<\/kbd>/);
  assert.match(html, /Copy selected versus peak-queue hour as Markdown/);
  assert.match(app, /function copySelectedVersusPeakHourMarkdown/);
  assert.match(app, /selectedVersusPeakHourToMarkdown\(scenario, selectedHour\)/);
  assert.match(app, /event\.key === "v"/);
});
