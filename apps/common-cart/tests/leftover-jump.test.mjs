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
