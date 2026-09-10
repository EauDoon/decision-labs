import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("caret leftover fill label copy jump stays on the organizer leftover label control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-label"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>\^<\/kbd> Focus the leftover-fill label copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-label"), false);
  assert.equal(merchantPanel.includes("focusLeftoverFillLabelCopy"), false);
  assert.match(app, /function focusLeftoverFillLabelCopy\(/u);
  assert.match(app, /#copy-leftover-fill-label/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /if \(key === "\^"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillLabelCopy\(\);/u);
  assert.doesNotMatch(app, /if \(key === "\^"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillLabel/u);
  assert.doesNotMatch(app, /if \(key === "\^"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillPickupCopy/u);
  assert.match(app, /if \(key === "&"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillPickupCopy\(\);/u);
});
