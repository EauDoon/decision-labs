import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("F8 leftover uncovered leftover-only count copy jump stays on the organizer leftover uncovered leftover-only count control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-count"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>F8<\/kbd> Focus the leftover uncovered leftover-only count copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-count"), false);
  assert.equal(merchantPanel.includes("focusLeftoverUncoveredLeftoverOnlyCountCopy"), false);
  assert.match(app, /function focusLeftoverUncoveredLeftoverOnlyCountCopy\(/u);
  assert.match(app, /#copy-leftover-uncovered-leftover-only-count/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyCountCopy\(\);/u);
  assert.doesNotMatch(app, /if \(key === "F8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyCount/u);
  assert.doesNotMatch(app, /if \(key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredCountCopy/u);
  assert.match(app, /if \(key === "F4"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredCountCopy\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
});

test("F9 hide first uncovered leftover buyer jump stays organizer-only", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-first-uncovered-leftover-buyer"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.match(html, /<kbd>F9<\/kbd> Focus hide first uncovered leftover buyer, or the buyer list if missing/u);
  assert.equal(merchantPanel.includes("hide-first-uncovered-leftover-buyer"), false);
  assert.equal(merchantPanel.includes("focusHideFirstUncoveredLeftoverBuyer"), false);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /function focusHideFirstUncoveredLeftoverBuyer\(/u);
  assert.match(app, /#hide-first-uncovered-leftover-buyer/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(key === "F9"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstUncoveredLeftoverBuyer\(\);/u);
  assert.doesNotMatch(app, /if \(key === "F9"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstLeftoverOnlyBuyer/u);
  assert.doesNotMatch(app, /if \(key === "F9"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstWinnerAllocatedBuyer/u);
  assert.match(app, /if \(key === "Backspace"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstWinnerAllocatedBuyer\(\);/u);
  assert.match(app, /if \(key === "ArrowLeft"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstLeftoverOnlyBuyer\(\);/u);
  assert.match(app, /if \(key === "ArrowRight"\) \{\s*event\.preventDefault\(\);\s*focusHideLastWinnerAllocatedBuyer\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
  assert.match(app, /\["ArrowLeft", "ArrowRight", "Home", "End"\]\.includes\(event\.key\)/u);
});
