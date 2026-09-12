import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Shift+F8 leftover uncovered leftover-only headroom copy jump stays on the organizer leftover uncovered leftover-only headroom control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-headroom"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>Shift\+F8<\/kbd> Focus the leftover uncovered leftover-only headroom copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-headroom"), false);
  assert.equal(merchantPanel.includes("focusLeftoverUncoveredLeftoverOnlyHeadroomCopy"), false);
  assert.match(app, /function focusLeftoverUncoveredLeftoverOnlyHeadroomCopy\(/u);
  assert.match(app, /#copy-leftover-uncovered-leftover-only-headroom/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(event\.shiftKey && key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyHeadroomCopy\(\);/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyHeadroom/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyUnitPriceCopy/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyCapacityCopy/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyAllocatedCopy/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyMinimumCopy/u);
  assert.doesNotMatch(app, /if \(key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyHeadroomCopy/u);
  assert.match(app, /if \(key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyCountCopy\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
});

test("hide last uncovered leftover buyer jump stays without Shift+F9", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-last-uncovered-leftover-buyer"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.equal(merchantPanel.includes("hide-last-uncovered-leftover-buyer"), false);
  assert.equal(merchantPanel.includes("focusHideLastUncoveredLeftoverBuyer"), false);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /function focusHideLastUncoveredLeftoverBuyer\(/u);
  assert.match(app, /#hide-last-uncovered-leftover-buyer/u);
  assert.match(app, /#buyers-list/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F9"\) \{\s*event\.preventDefault\(\);\s*focusHideLastUncoveredLeftoverBuyer/u);
  assert.match(app, /if \(key === "F12"\) \{\s*event\.preventDefault\(\);\s*focusHideLastUncoveredLeftoverBuyer\(\);/u);
  assert.match(app, /if \(key === "ArrowRight"\) \{\s*event\.preventDefault\(\);\s*focusHideLastWinnerAllocatedBuyer\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
  assert.match(app, /\["ArrowLeft", "ArrowRight", "Home", "End"\]\.includes\(event\.key\)/u);
});
