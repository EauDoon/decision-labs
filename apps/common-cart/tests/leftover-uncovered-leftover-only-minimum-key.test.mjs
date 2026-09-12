import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("leftover uncovered leftover-only minimum copy stays on its control without Shift+F7", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyMinimum\(/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyMinimumMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-minimum"/u);
  assert.doesNotMatch(html, /id="copy-leftover-uncovered-leftover-only-minimum"[^>]*aria-keyshortcuts="Shift\+F7"/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-headroom"[^>]*aria-keyshortcuts="Shift\+F7"/u);
  assert.match(html, /<kbd>Shift\+F7<\/kbd> Copy leftover uncovered leftover-only headroom \(organizer private\)/u);
  assert.match(app, /if \(key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyCount\(\);/u);
  assert.match(app, /if \(event\.shiftKey && key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyHeadroom\(\);/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyMinimum/u);
  assert.doesNotMatch(app, /if \(key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyMinimum/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});
