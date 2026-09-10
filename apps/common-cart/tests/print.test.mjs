import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("print leftover one-pager keeps leftover table and winner merchant label only", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(css, /body\.print-leftover/u);
  assert.match(css, /body\.print-leftover \.print-private/u);
  assert.match(css, /body\.print-leftover \.print-leftover-keep/u);
  assert.match(html, /id="leftover-coverage-rows"/u);
  assert.match(html, /id="leftover-print-winner"/u);
  assert.match(html, /Winner merchant:/u);
  assert.match(html, /print-leftover-keep/u);
  assert.match(app, /function printLeftoverOnePager\(/u);
  assert.match(app, /print-leftover/u);
  assert.match(app, /Winner merchant:/u);
  const leftoverPrint = app.slice(app.indexOf("function printLeftoverOnePager"), app.indexOf("function focusVariantOverlap"));
  assert.doesNotMatch(leftoverPrint, /leftoverBuyerIds/u);
});

test("print one-pager hides coach, help, and private buyer rows", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(css, /@media print/u);
  assert.match(css, /#coach-dialog/u);
  assert.match(css, /#shortcut-help/u);
  assert.match(css, /\.print-chrome/u);
  assert.match(css, /\.print-private/u);
  assert.match(css, /\.print-keep/u);
  assert.match(css, /\.scoreboard/u);
  assert.match(css, /\.residual-panel/u);
  assert.match(css, /#delivery-heatmap/u);
  assert.doesNotMatch(css, /break-before:\s*page/u);
  assert.match(html, /class="scoreboard print-keep"/u);
  assert.match(html, /residual-panel print-keep/u);
  assert.match(html, /print-private/u);
  assert.match(html, /id="buyer-rows"/u);
  assert.match(html, /id="inspector-rows"/u);
  assert.match(html, /Included locally/u);
  const buyerTable = html.slice(html.indexOf("Editable buyer constraints") - 200, html.indexOf("Editable buyer constraints"));
  assert.match(buyerTable, /print-private/u);
  const inspectorTable = html.slice(html.indexOf("Buyer outcomes for the inspected offer") - 200, html.indexOf("Buyer outcomes for the inspected offer"));
  assert.match(inspectorTable, /print-private/u);
  const review = html.slice(html.indexOf('id="cart-review"') - 80, html.indexOf('id="cart-review-tool"'));
  assert.match(review, /print-chrome/u);
});

test("print one-pager keeps title, winner aggregates, residual, and heatmap", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="page-title"/u);
  assert.match(html, /id="scenario-title"/u);
  assert.match(html, /id="metric-winner"/u);
  assert.match(html, /id="residual-summary"/u);
  assert.match(html, /id="delivery-heatmap"/u);
  assert.match(html, /id="merchant-result-rows"/u);
  assert.match(html, /no buyer labels, IDs, or individual allocations/u);
});
