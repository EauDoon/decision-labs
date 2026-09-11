import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Home tertiary fill maximum copy jump stays on the organizer tertiary maximum control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-tertiary-fill-maximum"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>Home<\/kbd> Focus the tertiary-fill maximum copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-tertiary-fill-maximum"), false);
  assert.equal(merchantPanel.includes("focusTertiaryFillMaximumCopy"), false);
  assert.match(app, /function focusTertiaryFillMaximumCopy\(/u);
  assert.match(app, /#copy-tertiary-fill-maximum/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === "Home"\) \{\s*event\.preventDefault\(\);\s*focusTertiaryFillMaximumCopy\(\);/u);
  assert.doesNotMatch(app, /if \(key === "Home"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillMaximum/u);
  assert.doesNotMatch(app, /if \(key === "Home"\) \{\s*event\.preventDefault\(\);\s*focusTertiaryFillRemainingCopy/u);
  assert.match(app, /if \(key === "2"\) \{\s*event\.preventDefault\(\);\s*focusTertiaryFillRemainingCopy\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
});
