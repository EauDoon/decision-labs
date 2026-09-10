import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("six leftover fill minimum copy jump stays on the organizer leftover minimum control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-minimum"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>6<\/kbd> Focus the leftover-fill minimum copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-minimum"), false);
  assert.equal(merchantPanel.includes("focusLeftoverFillMinimumCopy"), false);
  assert.match(app, /function focusLeftoverFillMinimumCopy\(/u);
  assert.match(app, /#copy-leftover-fill-minimum/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /if \(key === "6"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillMinimumCopy\(\);/u);
  assert.doesNotMatch(app, /if \(key === "6"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMinimum/u);
  assert.doesNotMatch(app, /if \(key === "6"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillLabelCopy/u);
  assert.match(app, /if \(key === "\^"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillLabelCopy\(\);/u);
});
