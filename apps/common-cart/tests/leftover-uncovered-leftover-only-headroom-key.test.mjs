import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Shift+F7 leftover uncovered leftover-only headroom copy uses the leftover uncovered leftover-only headroom control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(event\.shiftKey && key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyHeadroom\(\);/u);
  assert.match(app, /if \(key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyCount\(\);/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyHeadroom\(/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-headroom"/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-headroom"[^>]*aria-keyshortcuts="Shift\+F7"/u);
  assert.match(html, /<kbd>Shift\+F7<\/kbd> Copy leftover uncovered leftover-only headroom \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyCount/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyMinimum/u);
  assert.doesNotMatch(app, /if \(key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyHeadroom/u);
});
