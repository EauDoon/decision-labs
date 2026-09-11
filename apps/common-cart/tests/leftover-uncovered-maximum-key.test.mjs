import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Insert leftover uncovered maximum copy uses the leftover uncovered maximum control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(key === "Insert"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredMaximum\(\);/u);
  assert.match(app, /function copyLeftoverUncoveredMaximum\(/u);
  assert.match(app, /createLeftoverUncoveredMaximumMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-uncovered-maximum"/u);
  assert.match(html, /id="copy-leftover-uncovered-maximum"[^>]*aria-keyshortcuts="Insert"/u);
  assert.match(html, /<kbd>Insert<\/kbd> Copy leftover uncovered maximum \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "Insert"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredRemaining/u);
  assert.doesNotMatch(app, /if \(key === "Insert"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMaximum/u);
  assert.match(app, /if \(key === "PageUp"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredRemaining\(\);/u);
  assert.match(app, /if \(key === "8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMaximum\(\);/u);
});
