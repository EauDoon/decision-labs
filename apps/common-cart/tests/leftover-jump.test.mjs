import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clonePreset,
  organizerLeftoverRows,
  computeResidualCoverage,
  leftoverCoverageRows,
  validateScenario
} from "../src/model.js";

function leftoverFixture() {
  const source = clonePreset("neighbourhood");
  return validateScenario({
    title: "Residual fill fixture",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 }
    ]
  });
}

test("organizer leftover rows list leftover buyers after the winner", () => {
  const scenario = leftoverFixture();
  const coverage = computeResidualCoverage(scenario);
  const rows = organizerLeftoverRows(scenario);
  assert.equal(rows.length, coverage.leftoverBuyerCount);
  assert.deepEqual(rows.map((row) => row.label), ["Tea room", "Tea loft"]);
  assert.equal(rows.every((row) => row.uncovered === false), true);
  assert.equal(rows[0].status, "Leftover fill");
});

test("organizer leftover rows mark uncovered leftover when residual fill misses", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 40;
  const rows = organizerLeftoverRows(scenario);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].uncovered, true);
  assert.equal(rows[0].status, "Uncovered leftover");
  assert.equal(rows[1].uncovered, true);
  const coverageRows = leftoverCoverageRows(scenario);
  const uncovered = coverageRows.find((row) => row.id === "uncovered-leftover");
  assert.equal(uncovered.uncovered, true);
  assert.equal(uncovered.buyerCount, 2);
});

test("the leftover buyer table stays in the organizer residual panel", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="leftover-buyer-rows"/u);
  assert.match(buyerPanel, /print-private/u);
  assert.match(buyerPanel, /organizer-private/u);
  assert.equal(merchantPanel.includes("leftover-buyer-rows"), false);
});

test("tertiary leftover fill stays on the organizer leftover table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="leftover-coverage-rows"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.equal(merchantPanel.includes("focusTertiaryLeftoverFill"), false);
  assert.equal(merchantPanel.includes("tertiary leftover fill"), false);
  assert.match(app, /function focusTertiaryLeftoverFill\(/u);
  assert.match(app, /#tertiary-fill/u);
  assert.match(app, /#residual-title/u);
});

test("uncovered leftover coverage jump stays on the organizer leftover table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="leftover-coverage-rows"/u);
  assert.match(buyerPanel, /id="uncovered-leftover"|id="leftover-coverage-rows"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.equal(merchantPanel.includes("focusUncoveredLeftoverCoverageRow"), false);
  assert.equal(merchantPanel.includes("uncovered leftover coverage row"), false);
  assert.match(app, /function focusUncoveredLeftoverCoverageRow\(/u);
  assert.match(app, /#leftover-coverage-rows \.leftover-uncovered/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
});

test("leftover fill jump stays on the organizer leftover table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="leftover-coverage-rows"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.equal(merchantPanel.includes("focusLeftoverFill"), false);
  assert.equal(merchantPanel.includes("leftover fill jump"), false);
  assert.match(app, /function focusLeftoverFill\(/u);
  assert.match(app, /#leftover-fill/u);
  assert.match(app, /#residual-title/u);
});

test("leftover fill copy jump stays on the organizer leftover fill control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill"/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill"), false);
  assert.equal(merchantPanel.includes("focusLeftoverFillCopy"), false);
  assert.match(app, /function focusLeftoverFillCopy\(/u);
  assert.match(app, /#copy-leftover-fill/u);
  assert.match(app, /if \(key === "\/" && !event\.shiftKey\)/u);
});

test("requested units copy jump stays on the organizer requested-units control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-requested-units"/u);
  assert.equal(merchantPanel.includes("copy-requested-units"), false);
  assert.equal(merchantPanel.includes("focusRequestedUnitsCopy"), false);
  assert.match(app, /function focusRequestedUnitsCopy\(/u);
  assert.match(app, /#copy-requested-units/u);
  assert.match(app, /if \(key === "\["\)/u);
  assert.match(app, /#metric-units/u);
  assert.match(app, /#buyer-tab/u);
});

test("leftover fill unit-count copy stays on the organizer leftover fill units control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-units"/u);
  assert.match(buyerPanel, /Copy leftover fill units \(organizer private\)/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-units"), false);
  assert.equal(merchantPanel.includes("copyLeftoverFillUnitCount"), false);
  assert.match(app, /function copyLeftoverFillUnitCount\(/u);
  assert.match(app, /#copy-leftover-fill-units/u);
  assert.match(app, /if \(key === "'"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount\(\);/u);
});

test("leftover fill unit-count copy jump stays on the organizer leftover fill units control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-units"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-units"), false);
  assert.equal(merchantPanel.includes("focusLeftoverFillUnitCountCopy"), false);
  assert.match(app, /function focusLeftoverFillUnitCountCopy\(/u);
  assert.match(app, /#copy-leftover-fill-units/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /if \(key === "<"\)/u);
});

test("uncovered leftover unit-count copy stays on the organizer leftover control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-uncovered-leftover-units"/u);
  assert.match(buyerPanel, /Copy uncovered leftover units \(organizer private\)/u);
  assert.equal(merchantPanel.includes("copy-uncovered-leftover-units"), false);
  assert.equal(merchantPanel.includes("copyUncoveredLeftoverUnitCount"), false);
  assert.match(app, /function copyUncoveredLeftoverUnitCount\(/u);
  assert.match(app, /#copy-uncovered-leftover-units/u);
  assert.match(app, /function copyUncoveredLeftoverCounts\(/u);
  assert.match(app, /function copyLeftoverFillUnitCount\(/u);
  assert.match(app, /if \(key === ":"\) \{\s*event\.preventDefault\(\);\s*copyUncoveredLeftoverUnitCount\(\);/u);
});

test("uncovered leftover unit-count copy jump stays on the organizer leftover units control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-uncovered-leftover-units"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.equal(merchantPanel.includes("copy-uncovered-leftover-units"), false);
  assert.equal(merchantPanel.includes("focusUncoveredLeftoverUnitCountCopy"), false);
  assert.match(app, /function focusUncoveredLeftoverUnitCountCopy\(/u);
  assert.match(app, /#copy-uncovered-leftover-units/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /if \(key === "-"\)/u);
});

test("leftover fill merchant copy stays on the organizer leftover control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-merchant"/u);
  assert.match(buyerPanel, /Copy leftover fill merchant \(organizer private\)/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-merchant"), false);
  assert.equal(merchantPanel.includes("copyLeftoverFillMerchantLabel"), false);
  assert.match(app, /function copyLeftoverFillMerchantLabel\(/u);
  assert.match(app, /#copy-leftover-fill-merchant/u);
  assert.match(app, /function copyLeftoverFill\(/u);
  assert.match(app, /function copyLeftoverFillUnitCount\(/u);
  assert.match(app, /if \(key === '"'\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMerchantLabel\(\);/u);
});

test("leftover fill merchant copy jump stays on the organizer leftover fill merchant control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-merchant"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-merchant"), false);
  assert.equal(merchantPanel.includes("focusLeftoverFillMerchantCopy"), false);
  assert.match(app, /function focusLeftoverFillMerchantCopy\(/u);
  assert.match(app, /#copy-leftover-fill-merchant/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /if \(key === "_"\)/u);
});

test("leftover print jump stays on the leftover print control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="leftover-print-fill"[^>]*tabindex="-1"/u);
  assert.match(buyerPanel, /id="residual-title"/u);
  assert.equal(merchantPanel.includes("leftover-print-fill"), false);
  assert.equal(merchantPanel.includes("focusLeftoverPrintControl"), false);
  assert.match(app, /function focusLeftoverPrintControl\(/u);
  assert.match(app, /#leftover-print-fill/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /if \(key === "\]"\)/u);
});

test("leftover item headroom has a stable organizer focus target", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="leftover-headroom"/u);
  assert.match(buyerPanel, /Unspent item headroom after winner/u);
  assert.equal(merchantPanel.includes("leftover-headroom"), false);
  assert.match(app, /function focusLeftoverHeadroom\(/u);
  assert.match(app, /#leftover-headroom/u);
});
