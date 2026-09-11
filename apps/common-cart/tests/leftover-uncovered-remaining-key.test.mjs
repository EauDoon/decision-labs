import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("PageUp leftover uncovered remaining copy uses the leftover uncovered remaining control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
  assert.match(app, /if \(key === "PageUp"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredRemaining\(\);/u);
  assert.match(app, /function copyLeftoverUncoveredRemaining\(/u);
  assert.match(app, /createLeftoverUncoveredRemainingMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-uncovered-remaining"/u);
  assert.match(html, /id="copy-leftover-uncovered-remaining"[^>]*aria-keyshortcuts="PageUp"/u);
  assert.match(html, /<kbd>PageUp<\/kbd> Copy leftover uncovered remaining \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "PageUp"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillRemainingCapacity/u);
  assert.doesNotMatch(app, /if \(key === "PageUp"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillRemainingCapacity/u);
  assert.match(app, /if \(key === "1"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillRemainingCapacity\(\);/u);
  assert.match(app, /if \(key === "4"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillMaximum\(\);/u);
});
