import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("dollar leftover fill label copy uses the existing leftover-fill label control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === "\$"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillLabel\(\);/u);
  assert.match(app, /function copyLeftoverFillLabel\(/u);
  assert.match(app, /createLeftoverFillLabelMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-fill-label"/u);
  assert.match(html, /id="copy-leftover-fill-label"[^>]*aria-keyshortcuts="\$"/u);
  assert.match(html, /<kbd>\$<\/kbd> Copy leftover fill label \(organizer private\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "\$"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillPickup/u);
  assert.doesNotMatch(app, /if \(key === "\$"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
  assert.match(app, /if \(key === "\*"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillPickup\(\);/u);
});
