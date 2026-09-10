import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("eight leftover fill maximum copy uses the leftover-fill maximum control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === "8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMaximum\(\);/u);
  assert.match(app, /function copyLeftoverFillMaximum\(/u);
  assert.match(app, /createLeftoverFillMaximumMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-fill-maximum"/u);
  assert.match(html, /id="copy-leftover-fill-maximum"[^>]*aria-keyshortcuts="8"/u);
  assert.match(html, /<kbd>8<\/kbd> Copy leftover fill maximum \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMinimum/u);
  assert.doesNotMatch(app, /if \(key === "8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillLabel/u);
  assert.match(app, /if \(key === "5"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMinimum\(\);/u);
  assert.match(app, /if \(key === "\}"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillRemainingCapacity\(\);/u);
});
