import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Delete leftover uncovered minimum copy uses the leftover uncovered minimum control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(key === "Delete"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredMinimum\(\);/u);
  assert.match(app, /function copyLeftoverUncoveredMinimum\(/u);
  assert.match(app, /createLeftoverUncoveredMinimumMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-uncovered-minimum"/u);
  assert.match(html, /id="copy-leftover-uncovered-minimum"[^>]*aria-keyshortcuts="Delete"/u);
  assert.match(html, /<kbd>Delete<\/kbd> Copy leftover uncovered minimum \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "Delete"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredMaximum/u);
  assert.doesNotMatch(app, /if \(key === "Delete"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMinimum/u);
  assert.match(app, /if \(key === "Insert"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredMaximum\(\);/u);
  assert.match(app, /if \(key === "5"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMinimum\(\);/u);
});
