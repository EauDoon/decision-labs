import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("four tertiary fill maximum copy uses the tertiary-fill maximum control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === "4"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillMaximum\(\);/u);
  assert.match(app, /function copyTertiaryFillMaximum\(/u);
  assert.match(app, /createTertiaryFillMaximumMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-tertiary-fill-maximum"/u);
  assert.match(html, /id="copy-tertiary-fill-maximum"[^>]*aria-keyshortcuts="4"/u);
  assert.match(html, /<kbd>4<\/kbd> Copy tertiary fill maximum \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "4"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillRemainingCapacity/u);
  assert.doesNotMatch(app, /if \(key === "4"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMaximum/u);
  assert.match(app, /if \(key === "1"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillRemainingCapacity\(\);/u);
  assert.match(app, /if \(key === "8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMaximum\(\);/u);
});
