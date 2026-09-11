import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("one tertiary fill remaining copy uses the tertiary-fill remaining control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === "1"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillRemainingCapacity\(\);/u);
  assert.match(app, /function copyTertiaryFillRemainingCapacity\(/u);
  assert.match(app, /createTertiaryFillRemainingCapacityMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-tertiary-fill-remaining"/u);
  assert.match(html, /id="copy-tertiary-fill-remaining"[^>]*aria-keyshortcuts="1"/u);
  assert.match(html, /<kbd>1<\/kbd> Copy tertiary fill remaining capacity \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "1"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMaximum/u);
  assert.doesNotMatch(app, /if \(key === "1"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillRemainingCapacity/u);
  assert.match(app, /if \(key === "8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMaximum\(\);/u);
  assert.match(app, /if \(key === "\}"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillRemainingCapacity\(\);/u);
});
