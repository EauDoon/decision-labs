import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("F10 leftover uncovered leftover-only remaining copy uses the leftover uncovered leftover-only remaining control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(key === "F10"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyRemaining\(\);/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyRemaining\(/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyRemainingMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-remaining"/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-remaining"[^>]*aria-keyshortcuts="F10"/u);
  assert.match(html, /<kbd>F10<\/kbd> Copy leftover uncovered leftover-only remaining \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "F10"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyCount/u);
  assert.doesNotMatch(app, /if \(key === "F10"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredRemaining/u);
  assert.match(app, /if \(key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyCount\(\);/u);
  assert.match(app, /if \(key === "PageUp"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredRemaining\(\);/u);
});
