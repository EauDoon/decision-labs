import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("leftover uncovered leftover-only minimum copy jump stays on the organizer leftover uncovered leftover-only minimum control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-minimum"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-minimum"), false);
  assert.equal(merchantPanel.includes("focusLeftoverUncoveredLeftoverOnlyMinimumCopy"), false);
  assert.match(app, /function focusLeftoverUncoveredLeftoverOnlyMinimumCopy\(/u);
  assert.match(app, /#copy-leftover-uncovered-leftover-only-minimum/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyMinimumCopy/u);
  assert.doesNotMatch(app, /if \(key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyMinimumCopy/u);
  assert.match(app, /if \(key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyCountCopy\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
});

test("unshifted F9 and Shift+F12 still jump to hide first uncovered leftover buyer", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-first-uncovered-leftover-buyer"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.equal(merchantPanel.includes("hide-first-uncovered-leftover-buyer"), false);
  assert.equal(merchantPanel.includes("focusHideFirstUncoveredLeftoverBuyer"), false);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /function focusHideFirstUncoveredLeftoverBuyer\(/u);
  assert.match(app, /#hide-first-uncovered-leftover-buyer/u);
  assert.match(app, /#buyers-list/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F9"\) \{\s*event\.preventDefault\(\);\s*focusHideLastUncoveredLeftoverBuyer/u);
  assert.match(app, /if \(event\.shiftKey && key === "F9"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstUncoveredLeftoverBuyer\(\);/u);
  assert.match(app, /if \(key === "F9"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstUncoveredLeftoverBuyer\(\);/u);
  assert.match(app, /if \(event\.shiftKey && key === "F12"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstUncoveredLeftoverBuyer\(\);/u);
  assert.match(app, /if \(key === "ArrowRight"\) \{\s*event\.preventDefault\(\);\s*focusHideLastWinnerAllocatedBuyer\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
  assert.match(app, /\["ArrowLeft", "ArrowRight", "Home", "End"\]\.includes\(event\.key\)/u);
});
