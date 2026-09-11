import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("PageDown leftover uncovered remaining copy jump stays on the organizer leftover uncovered remaining control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-remaining"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>PageDown<\/kbd> Focus the leftover uncovered remaining copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-remaining"), false);
  assert.equal(merchantPanel.includes("focusLeftoverUncoveredRemainingCopy"), false);
  assert.match(app, /function focusLeftoverUncoveredRemainingCopy\(/u);
  assert.match(app, /#copy-leftover-uncovered-remaining/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === "PageDown"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredRemainingCopy\(\);/u);
  assert.doesNotMatch(app, /if \(key === "PageDown"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredRemaining/u);
  assert.doesNotMatch(app, /if \(key === "PageDown"\) \{\s*event\.preventDefault\(\);\s*focusTertiaryFillRemainingCopy/u);
  assert.match(app, /if \(key === "2"\) \{\s*event\.preventDefault\(\);\s*focusTertiaryFillRemainingCopy\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
});

test("ArrowUp hide last leftover-only buyer jump stays organizer-only", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-last-leftover-only-buyer"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.match(html, /<kbd>ArrowUp<\/kbd> Focus hide last leftover-only buyer, or the buyer list if missing/u);
  assert.equal(merchantPanel.includes("hide-last-leftover-only-buyer"), false);
  assert.equal(merchantPanel.includes("focusHideLastLeftoverOnlyBuyer"), false);
  assert.match(app, /function focusHideLastLeftoverOnlyBuyer\(/u);
  assert.match(app, /#hide-last-leftover-only-buyer/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(key === "ArrowUp"\) \{\s*event\.preventDefault\(\);\s*focusHideLastLeftoverOnlyBuyer\(\);/u);
  assert.doesNotMatch(app, /if \(key === "ArrowUp"\) \{\s*event\.preventDefault\(\);\s*focusHideLastUnservedBuyer/u);
  assert.doesNotMatch(app, /if \(key === "ArrowUp"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstUnservedBuyer/u);
  assert.match(app, /if \(key === "3"\) \{\s*event\.preventDefault\(\);\s*focusHideLastUnservedBuyer\(\);/u);
  assert.match(app, /if \(key === "End"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstUnservedBuyer\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
});
