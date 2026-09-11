import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Shift+F10 leftover uncovered leftover-only maximum copy uses the leftover uncovered leftover-only maximum control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(event\.shiftKey && key === "F10"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyMaximum\(\);/u);
  assert.match(app, /if \(key === "F10"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyRemaining\(\);/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyMaximum\(/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyMaximumMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-maximum"/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-maximum"[^>]*aria-keyshortcuts="Shift\+F10"/u);
  assert.match(html, /<kbd>Shift\+F10<\/kbd> Copy leftover uncovered leftover-only maximum \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F10"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyRemaining/u);
  assert.doesNotMatch(app, /if \(key === "F10"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyMaximum/u);
});
