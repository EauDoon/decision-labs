import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard t is wired to the timing review heading", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="weekend-review-title"/);
  assert.match(html, /<kbd>T<\/kbd>/);
  assert.match(html, /Jump to the timing review/);
  assert.match(app, /function jumpToTimingReview/);
  assert.match(app, /#weekend-review-title/);
  assert.match(app, /event\.key === "t"/);
});
