import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("F2 leftover uncovered minimum copy jump stays on the organizer leftover uncovered minimum control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-minimum"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>F2<\/kbd> Focus the leftover uncovered minimum copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-minimum"), false);
  assert.equal(merchantPanel.includes("focusLeftoverUncoveredMinimumCopy"), false);
  assert.match(app, /function focusLeftoverUncoveredMinimumCopy\(/u);
  assert.match(app, /#copy-leftover-uncovered-minimum/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(key === "F2"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredMinimumCopy\(\);/u);
  assert.doesNotMatch(app, /if \(key === "F2"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredMinimum/u);
  assert.doesNotMatch(app, /if \(key === "F2"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredMaximumCopy/u);
  assert.match(app, /if \(key === "ArrowDown"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredMaximumCopy\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
});

test("ArrowRight hide last winner-allocated buyer jump stays organizer-only", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-last-winner-allocated-buyer"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.match(html, /<kbd>ArrowRight<\/kbd> Focus hide last winner-allocated buyer, or the buyer list if missing/u);
  assert.equal(merchantPanel.includes("hide-last-winner-allocated-buyer"), false);
  assert.equal(merchantPanel.includes("focusHideLastWinnerAllocatedBuyer"), false);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /function focusHideLastWinnerAllocatedBuyer\(/u);
  assert.match(app, /#hide-last-winner-allocated-buyer/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(key === "ArrowRight"\) \{\s*event\.preventDefault\(\);\s*focusHideLastWinnerAllocatedBuyer\(\);/u);
  assert.doesNotMatch(app, /if \(key === "ArrowRight"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstLeftoverOnlyBuyer/u);
  assert.doesNotMatch(app, /if \(key === "ArrowRight"\) \{\s*event\.preventDefault\(\);\s*focusHideLastLeftoverOnlyBuyer/u);
  assert.match(app, /if \(key === "ArrowLeft"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstLeftoverOnlyBuyer\(\);/u);
  assert.match(app, /if \(key === "ArrowUp"\) \{\s*event\.preventDefault\(\);\s*focusHideLastLeftoverOnlyBuyer\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
  assert.match(app, /\["ArrowLeft", "ArrowRight", "Home", "End"\]\.includes\(event\.key\)/u);
});
