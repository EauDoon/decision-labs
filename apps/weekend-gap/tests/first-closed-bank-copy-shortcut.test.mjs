import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard apostrophe is wired to copy first closed bank hour through the existing control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-bank"/);
  assert.match(html, /<kbd>'<\/kbd>/);
  assert.match(html, /Copy first closed bank hour as Markdown/);
  assert.match(app, /function copyFirstClosedBankHourMarkdown/);
  assert.match(app, /firstClosedBankHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "'"/);
  assert.match(app, /copyFirstClosedBankHourMarkdown\(\)/);
  assert.match(app, /function copyFirstClosedFxHourMarkdown/);
  assert.notEqual(app.match(/function copyFirstClosedBankHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
});
