import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("F4 leftover uncovered count copy jump stays on the organizer leftover uncovered count control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-count"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.match(html, /<kbd>F4<\/kbd> Focus the leftover uncovered count copy control, or leftover heading if missing/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-count"), false);
  assert.equal(merchantPanel.includes("focusLeftoverUncoveredCountCopy"), false);
  assert.match(app, /function focusLeftoverUncoveredCountCopy\(/u);
  assert.match(app, /#copy-leftover-uncovered-count/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /if \(key === "F4"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredCountCopy\(\);/u);
  assert.doesNotMatch(app, /if \(key === "F4"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredCount/u);
  assert.doesNotMatch(app, /if \(key === "F4"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredMinimumCopy/u);
  assert.match(app, /if \(key === "F2"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverUncoveredMinimumCopy\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
});

test("Backspace hide first winner-allocated buyer jump stays organizer-only", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-first-winner-allocated-buyer"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.match(html, /<kbd>Backspace<\/kbd> Focus hide first winner-allocated buyer, or the buyer list if missing/u);
  assert.equal(merchantPanel.includes("hide-first-winner-allocated-buyer"), false);
  assert.equal(merchantPanel.includes("focusHideFirstWinnerAllocatedBuyer"), false);
  assert.match(app, /function handleShortcut\(event\) \{\s*if \(event\.defaultPrevented \|\| event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey\) return;/u);
  assert.match(app, /function focusHideFirstWinnerAllocatedBuyer\(/u);
  assert.match(app, /#hide-first-winner-allocated-buyer/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(key === "Backspace"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstWinnerAllocatedBuyer\(\);/u);
  assert.doesNotMatch(app, /if \(key === "Backspace"\) \{\s*event\.preventDefault\(\);\s*focusHideLastWinnerAllocatedBuyer/u);
  assert.doesNotMatch(app, /if \(key === "Backspace"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstLeftoverOnlyBuyer/u);
  assert.match(app, /if \(key === "ArrowRight"\) \{\s*event\.preventDefault\(\);\s*focusHideLastWinnerAllocatedBuyer\(\);/u);
  assert.match(app, /if \(key === "ArrowLeft"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstLeftoverOnlyBuyer\(\);/u);
  assert.match(app, /if \(event\.defaultPrevented/u);
  assert.match(app, /\["ArrowLeft", "ArrowRight", "Home", "End"\]\.includes\(event\.key\)/u);
});
