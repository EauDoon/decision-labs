import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("ArrowDown leftover uncovered maximum copy jump stays on the organizer leftover uncovered maximum control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-maximum"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>ArrowDown<\/kbd> Focus the leftover uncovered maximum copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-maximum"), false);
  assert.equal(merchantPanel.includes("focusLeftoverUncoveredMaximumCopy"), false);
  assert.match(app, /function focusLeftoverUncoveredMaximumCopy\(/u);
  assert.match(app, /#copy-leftover-uncovered-maximum/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(key === "ArrowDown"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredMaximumCopy\(\);/u);
  assert.doesNotMatch(app, /if \(key === "ArrowDown"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredMaximum/u);
  assert.doesNotMatch(app, /if \(key === "ArrowDown"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredRemainingCopy/u);
  assert.match(app, /if \(key === "PageDown"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredRemainingCopy\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
});

test("ArrowLeft hide first leftover-only buyer jump stays organizer-only", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-first-leftover-only-buyer"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.match(html, /<kbd>ArrowLeft<\/kbd> Focus hide first leftover-only buyer, or the buyer list if missing/u);
  assert.equal(merchantPanel.includes("hide-first-leftover-only-buyer"), false);
  assert.equal(merchantPanel.includes("focusHideFirstLeftoverOnlyBuyer"), false);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /function focusHideFirstLeftoverOnlyBuyer\(/u);
  assert.match(app, /#hide-first-leftover-only-buyer/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(key === "ArrowLeft"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstLeftoverOnlyBuyer\(\);/u);
  assert.doesNotMatch(app, /if \(key === "ArrowLeft"\) \{\s*event\.preventDefault\(\);\s*focusHideLastLeftoverOnlyBuyer/u);
  assert.doesNotMatch(app, /if \(key === "ArrowLeft"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstUnservedBuyer/u);
  assert.match(app, /if \(key === "ArrowUp"\) \{\s*event\.preventDefault\(\);\s*focusHideLastLeftoverOnlyBuyer\(\);/u);
  assert.match(app, /if \(key === "End"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstUnservedBuyer\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
  assert.match(app, /\["ArrowLeft", "ArrowRight", "Home", "End"\]\.includes\(event\.key\)/u);
});
