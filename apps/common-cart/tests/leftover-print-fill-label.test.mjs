import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("print leftover one-pager includes leftover-fill label when leftover fill exists", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="leftover-print-fill-label"/u);
  assert.match(html, /Leftover fill label: none/u);
  assert.match(html, /id="leftover-print-fill-pickup"/u);
  assert.match(html, /id="leftover-print-winner"/u);
  assert.match(html, /Winner merchant:/u);
  assert.match(css, /body\.print-leftover #leftover-print-fill-label/u);
  const leftover = html.slice(html.indexOf('id="leftover-print-fill-label"'), html.indexOf('id="copy-winning-merchant"'));
  assert.match(leftover, /print-leftover-keep/u);
  assert.equal(leftover.includes("maxUnitPrice"), false);
  assert.equal(leftover.includes("selectedBuyerIds"), false);
  assert.equal(leftover.includes("leftoverBuyerIds"), false);
  assert.match(app, /leftover-print-fill-label/u);
  assert.match(app, /Leftover fill label:/u);
  assert.match(app, /Leftover fill label: \$\{coverage\.secondary\.merchant\} \/ \$\{coverage\.secondary\.variant\}/u);
  assert.match(app, /coverage\.secondary/u);
  assert.match(app, /Winner merchant:/u);
  const leftoverPrint = app.slice(app.indexOf("function printLeftoverOnePager"), app.indexOf("function focusVariantOverlap"));
  assert.doesNotMatch(leftoverPrint, /leftoverBuyerIds/u);
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.equal(merchantPanel.includes("leftover-print-fill-label"), false);
});
