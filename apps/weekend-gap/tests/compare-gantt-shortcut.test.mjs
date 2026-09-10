import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard m is wired to the compare Gantt heading", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="compare-gantt-title"/);
  assert.match(html, /<kbd>M<\/kbd>/);
  assert.match(html, /Jump to the compare Gantt/);
  assert.match(app, /function jumpToCompareGantt/);
  assert.match(app, /#compare-gantt-title/);
  assert.match(app, /event\.key === "m"/);
  assert.match(app, /return jumpToGantt\(\)/);
});
