import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard left bracket is wired to the hours-to-clear copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-hours-to-clear"/);
  assert.match(html, /<kbd>\[<\/kbd>/);
  assert.match(html, /Jump to the hours-to-clear copy control/);
  assert.match(app, /function jumpToHoursToClearCopy/);
  assert.match(app, /#copy-hours-to-clear/);
  assert.match(app, /event\.key === "\["/);
  assert.match(app, /function jumpToHoursToClear/);
  assert.match(app, /function jumpToDashboard/);
  assert.notEqual(app.match(/function jumpToHoursToClearCopy/)?.[0], app.match(/function jumpToHoursToClear/)?.[0]);
  assert.notEqual(app.match(/function jumpToHoursToClearCopy/)?.[0], app.match(/function jumpToDashboard/)?.[0]);
});
