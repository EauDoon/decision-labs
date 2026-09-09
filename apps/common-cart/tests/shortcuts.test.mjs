import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("shortcut help documents the merchant inspector jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>m<\/kbd> Focus the merchant inspector region/u);
  assert.match(html, /id="merchant-inspector-region"/u);
  assert.match(html, /id="merchant-panel"[^>]*tabindex="-1"/u);
});

test("keyboard handler jumps to the merchant inspector when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "m"\)/u);
  assert.match(app, /function focusMerchantInspector\(/u);
  assert.match(app, /#merchant-inspector-region/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});
