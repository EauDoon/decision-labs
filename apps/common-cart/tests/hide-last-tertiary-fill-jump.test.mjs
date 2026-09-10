import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("zero hide last tertiary-fill buyer jump stays organizer-only", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-last-buyer-filled-by-tertiary-fill"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.match(html, /<kbd>0<\/kbd> Focus hide last tertiary-fill buyer, or the buyer list if missing/u);
  assert.equal(merchantPanel.includes("hide-last-buyer-filled-by-tertiary-fill"), false);
  assert.equal(merchantPanel.includes("focusHideLastBuyerFilledByTertiaryFill"), false);
  assert.match(app, /function focusHideLastBuyerFilledByTertiaryFill\(/u);
  assert.match(app, /#hide-last-buyer-filled-by-tertiary-fill/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /if \(key === "0"\) \{\s*event\.preventDefault\(\);\s*focusHideLastBuyerFilledByTertiaryFill\(\);/u);
  assert.doesNotMatch(app, /if \(key === "0"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstBuyerFilledByTertiaryFill/u);
  assert.doesNotMatch(app, /if \(key === "0"\) \{\s*event\.preventDefault\(\);\s*focusHideLastBuyerFilledByLeftoverFill/u);
  assert.match(app, /if \(key === "7"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstBuyerFilledByTertiaryFill\(\);/u);
});
