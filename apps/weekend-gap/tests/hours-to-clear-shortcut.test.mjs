import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard k is wired to the hours-to-clear line", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="hours-to-clear-line"/);
  assert.match(html, /<kbd>K<\/kbd>/);
  assert.match(html, /Jump to the hours-to-clear line/);
  assert.match(app, /function jumpToHoursToClear/);
  assert.match(app, /#hours-to-clear-line/);
  assert.match(app, /event\.key === "k"/);
  assert.match(app, /isEditableTarget/);
});
