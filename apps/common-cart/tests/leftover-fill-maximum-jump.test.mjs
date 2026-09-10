import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("nine leftover fill maximum copy jump stays on the organizer leftover maximum control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-maximum"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>9<\/kbd> Focus the leftover-fill maximum copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-maximum"), false);
  assert.equal(merchantPanel.includes("focusLeftoverFillMaximumCopy"), false);
  assert.match(app, /function focusLeftoverFillMaximumCopy\(/u);
  assert.match(app, /#copy-leftover-fill-maximum/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /if \(key === "9"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillMaximumCopy\(\);/u);
  assert.doesNotMatch(app, /if \(key === "9"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMaximum/u);
  assert.doesNotMatch(app, /if \(key === "9"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillMinimumCopy/u);
  assert.match(app, /if \(key === "6"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillMinimumCopy\(\);/u);
});
