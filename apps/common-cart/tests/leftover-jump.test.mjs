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
