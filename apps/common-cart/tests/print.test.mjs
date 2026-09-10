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

test("print leftover one-pager includes merchant-safe variant overlap counts", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="leftover-print-overlap"/u);
  assert.match(html, /id="leftover-print-overlap-rows"/u);
  assert.match(html, /Merchant-safe variant overlap counts/u);
  assert.match(css, /body\.print-leftover #leftover-print-overlap/u);
  const leftover = html.slice(html.indexOf('id="leftover-print-overlap"'), html.indexOf('id="leftover-coverage"'));
  assert.match(leftover, /print-leftover-keep/u);
  assert.match(leftover, /Labels, IDs, budgets, and allocations are omitted/u);
  assert.equal(leftover.includes("maxUnitPrice"), false);
  assert.equal(leftover.includes("selectedBuyerIds"), false);
  assert.match(app, /function renderLeftoverPrintOverlap\(/u);
  assert.match(app, /variantOverlapMatrix\(/u);
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.equal(merchantPanel.includes("leftover-print-overlap"), false);
});

test("print leftover one-pager includes uncovered leftover buyer and unit counts", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="leftover-print-uncovered"/u);
  assert.match(html, /Uncovered leftover: 0 buyers, 0 units/u);
  assert.match(html, /id="leftover-print-winner"/u);
  assert.match(html, /Winner merchant:/u);
  assert.match(css, /body\.print-leftover #leftover-print-uncovered/u);
  const leftover = html.slice(html.indexOf('id="leftover-print-uncovered"'), html.indexOf('id="copy-winning-merchant"'));
  assert.match(leftover, /print-leftover-keep/u);
  assert.equal(leftover.includes("maxUnitPrice"), false);
  assert.equal(leftover.includes("selectedBuyerIds"), false);
  assert.equal(leftover.includes("leftoverBuyerIds"), false);
  assert.match(app, /leftover-print-uncovered/u);
  assert.match(app, /unfilledBuyerCount/u);
  assert.match(app, /unfilledUnits/u);
  assert.match(app, /Winner merchant:/u);
  const leftoverPrint = app.slice(app.indexOf("function printLeftoverOnePager"), app.indexOf("function focusVariantOverlap"));
  assert.doesNotMatch(leftoverPrint, /leftoverBuyerIds/u);
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.equal(merchantPanel.includes("leftover-print-uncovered"), false);
});

test("print leftover one-pager includes requested units as a count", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="leftover-print-requested"/u);
  assert.match(html, /Requested units: 0/u);
  assert.match(html, /id="leftover-print-winner"/u);
  assert.match(html, /Winner merchant:/u);
  assert.match(css, /body\.print-leftover #leftover-print-requested/u);
  const leftover = html.slice(html.indexOf('id="leftover-print-requested"'), html.indexOf('id="copy-winning-merchant"'));
  assert.match(leftover, /print-leftover-keep/u);
  assert.equal(leftover.includes("maxUnitPrice"), false);
  assert.equal(leftover.includes("selectedBuyerIds"), false);
  assert.equal(leftover.includes("leftoverBuyerIds"), false);
  assert.match(app, /leftover-print-requested/u);
  assert.match(app, /totalRequestedUnits/u);
  assert.match(app, /Winner merchant:/u);
  const leftoverPrint = app.slice(app.indexOf("function printLeftoverOnePager"), app.indexOf("function focusVariantOverlap"));
  assert.doesNotMatch(leftoverPrint, /leftoverBuyerIds/u);
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.equal(merchantPanel.includes("leftover-print-requested"), false);
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
