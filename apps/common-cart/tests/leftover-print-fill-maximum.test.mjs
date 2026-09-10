import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("print leftover one-pager includes leftover-fill maximum when leftover fill exists", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="leftover-print-fill-maximum"/u);
  assert.match(html, /Leftover fill maximum: none/u);
  assert.match(html, /id="leftover-print-fill-minimum"/u);
  assert.match(html, /id="leftover-print-winner"/u);
  assert.match(html, /Winner merchant:/u);
  assert.match(css, /body\.print-leftover #leftover-print-fill-maximum/u);
  const leftover = html.slice(html.indexOf('id="leftover-print-fill-maximum"'), html.indexOf('id="copy-winning-merchant"'));
  assert.match(leftover, /print-leftover-keep/u);
  assert.equal(leftover.includes("maxUnitPrice"), false);
  assert.equal(leftover.includes("selectedBuyerIds"), false);
  assert.equal(leftover.includes("leftoverBuyerIds"), false);
  assert.match(app, /leftover-print-fill-maximum/u);
  assert.match(app, /Leftover fill maximum:/u);
  assert.match(app, /Leftover fill maximum: \$\{leftoverOffer\.capacity\} units/u);
  assert.match(app, /coverage\.secondary/u);
  assert.match(app, /Winner merchant:/u);
  const leftoverPrint = app.slice(app.indexOf("function printLeftoverOnePager"), app.indexOf("function focusVariantOverlap"));
  assert.doesNotMatch(leftoverPrint, /leftoverBuyerIds/u);
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.equal(merchantPanel.includes("leftover-print-fill-maximum"), false);
});
