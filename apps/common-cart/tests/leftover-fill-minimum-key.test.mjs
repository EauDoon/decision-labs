import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("five leftover fill minimum copy uses the leftover-fill minimum control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === "5"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMinimum\(\);/u);
  assert.match(app, /function copyLeftoverFillMinimum\(/u);
  assert.match(app, /createLeftoverFillMinimumMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-fill-minimum"/u);
  assert.match(html, /id="copy-leftover-fill-minimum"[^>]*aria-keyshortcuts="5"/u);
  assert.match(html, /<kbd>5<\/kbd> Copy leftover fill minimum \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "5"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillLabel/u);
  assert.doesNotMatch(app, /if \(key === "5"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillPickup/u);
  assert.match(app, /if \(key === "\$"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillLabel\(\);/u);
  assert.match(app, /if \(key === "\*"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillPickup\(\);/u);
});
