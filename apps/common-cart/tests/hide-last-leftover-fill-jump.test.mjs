import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("backtick jumps to hide last leftover-fill buyer, not leftover-fill-all", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(html, /<kbd>&#96;<\/kbd> Focus hide last leftover-fill buyer, or the buyer list if missing/u);
  assert.match(buyerPanel, /id="hide-last-buyer-filled-by-leftover-fill"/u);
  assert.match(buyerPanel, /id="buyers-list"/u);
  assert.equal(merchantPanel.includes("hide-last-buyer-filled-by-leftover-fill"), false);
  assert.equal(merchantPanel.includes("focusHideLastBuyerFilledByLeftoverFill"), false);
  assert.match(app, /function focusHideLastBuyerFilledByLeftoverFill\(/u);
  assert.match(app, /#hide-last-buyer-filled-by-leftover-fill/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /if \(key === "`"\) \{\s*event\.preventDefault\(\);\s*focusHideLastBuyerFilledByLeftoverFill\(\);/u);
  assert.doesNotMatch(app, /if \(key === "`"\) \{\s*event\.preventDefault\(\);\s*focusHideBuyersFilledByLeftoverFill/u);
  assert.match(app, /if \(key === "%"\) \{\s*event\.preventDefault\(\);\s*focusHideBuyersFilledByLeftoverFill\(\);/u);
});
