import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("F7 leftover uncovered leftover-only count copy uses the leftover uncovered leftover-only count control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyCount\(\);/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyCount\(/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyCountMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-count"/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-count"[^>]*aria-keyshortcuts="F7"/u);
  assert.match(html, /<kbd>F7<\/kbd> Copy leftover uncovered leftover-only count \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredCount/u);
  assert.doesNotMatch(app, /if \(key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredMinimum/u);
  assert.match(app, /if \(key === "F3"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredCount\(\);/u);
});
