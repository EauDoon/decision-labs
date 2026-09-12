import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("leftover uncovered leftover-only capacity copy jump stays on the organizer leftover uncovered leftover-only capacity control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-capacity"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-capacity"), false);
  assert.equal(merchantPanel.includes("focusLeftoverUncoveredLeftoverOnlyCapacityCopy"), false);
  assert.match(app, /function focusLeftoverUncoveredLeftoverOnlyCapacityCopy\(/u);
  assert.match(app, /#copy-leftover-uncovered-leftover-only-capacity/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyCapacityCopy/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyCapacity/u);
  assert.doesNotMatch(app, /if \(key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyCapacityCopy/u);
  assert.match(app, /if \(event\.shiftKey && key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyRemainingCopy\(\);/u);
  assert.match(app, /if \(key === "F8"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredLeftoverOnlyCountCopy\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
});

test("ArrowUp still jumps to hide last leftover-only buyer", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-last-leftover-only-buyer"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.equal(merchantPanel.includes("hide-last-leftover-only-buyer"), false);
  assert.equal(merchantPanel.includes("focusHideLastLeftoverOnlyBuyer"), false);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /function focusHideLastLeftoverOnlyBuyer\(/u);
  assert.match(app, /#hide-last-leftover-only-buyer/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(event\.shiftKey && key === "F9"\) \{\s*event\.preventDefault\(\);\s*focusHideLastLeftoverOnlyBuyer\(\);/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F9"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstLeftoverOnlyBuyer/u);
  assert.match(app, /if \(key === "F9"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstUncoveredLeftoverBuyer\(\);/u);
  assert.match(app, /if \(event\.shiftKey && key === "F12"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstUncoveredLeftoverBuyer\(\);/u);
  assert.match(app, /if \(key === "F12"\) \{\s*event\.preventDefault\(\);\s*focusHideLastUncoveredLeftoverBuyer\(\);/u);
  assert.match(app, /if \(key === "ArrowUp"\) \{\s*event\.preventDefault\(\);\s*focusHideLastLeftoverOnlyBuyer\(\);/u);
  assert.match(app, /if \(key === "ArrowRight"\) \{\s*event\.preventDefault\(\);\s*focusHideLastWinnerAllocatedBuyer\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
  assert.match(app, /\["ArrowLeft", "ArrowRight", "Home", "End"\]\.includes\(event\.key\)/u);
});
