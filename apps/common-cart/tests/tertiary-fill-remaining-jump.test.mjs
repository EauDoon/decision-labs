import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("two tertiary fill remaining copy jump stays on the organizer tertiary remaining control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-tertiary-fill-remaining"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>2<\/kbd> Focus the tertiary-fill remaining copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-tertiary-fill-remaining"), false);
  assert.equal(merchantPanel.includes("focusTertiaryFillRemainingCopy"), false);
  assert.match(app, /function focusTertiaryFillRemainingCopy\(/u);
  assert.match(app, /#copy-tertiary-fill-remaining/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /if \(key === "2"\) \{\s*event\.preventDefault\(\);\s*focusTertiaryFillRemainingCopy\(\);/u);
  assert.doesNotMatch(app, /if \(key === "2"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillRemainingCapacity/u);
  assert.doesNotMatch(app, /if \(key === "2"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillMaximumCopy/u);
  assert.match(app, /if \(key === "9"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillMaximumCopy\(\);/u);
});

test("three hide last unserved buyer jump stays organizer-only", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-last-unserved-buyer"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.match(html, /<kbd>3<\/kbd> Focus hide last unserved buyer, or the buyer list if missing/u);
  assert.equal(merchantPanel.includes("hide-last-unserved-buyer"), false);
  assert.equal(merchantPanel.includes("focusHideLastUnservedBuyer"), false);
  assert.match(app, /function focusHideLastUnservedBuyer\(/u);
  assert.match(app, /#hide-last-unserved-buyer/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(key === "3"\) \{\s*event\.preventDefault\(\);\s*focusHideLastUnservedBuyer\(\);/u);
  assert.doesNotMatch(app, /if \(key === "3"\) \{\s*event\.preventDefault\(\);\s*focusHideLastBuyerFilledByTertiaryFill/u);
  assert.doesNotMatch(app, /if \(key === "3"\) \{\s*event\.preventDefault\(\);\s*focusHideUnservedBuyers/u);
  assert.match(app, /if \(key === "0"\) \{\s*event\.preventDefault\(\);\s*focusHideLastBuyerFilledByTertiaryFill\(\);/u);
});
