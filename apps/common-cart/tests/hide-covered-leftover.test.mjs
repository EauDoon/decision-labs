import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  evaluateMarket,
  leftoverCoverageRows,
  filterLeftoverCoverageRowsHidingCovered,
  computeResidualCoverage,
  validateScenario
} from "../src/model.js";

function leftoverFixture() {
  const source = clonePreset("neighbourhood");
  return validateScenario({
    title: "Residual fill fixture",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "SECRET_LABEL", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
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

test("hide covered leftover rows is display-only and leaves matching unchanged", () => {
  const scenario = leftoverFixture();
  const original = scenario.buyers.map((buyer) => buyer.id);
  const market = evaluateMarket(scenario);
  const winnerId = market.winner.offer.id;
  const coverage = computeResidualCoverage(scenario);
  const all = filterLeftoverCoverageRowsHidingCovered(scenario, false);
  const shown = filterLeftoverCoverageRowsHidingCovered(scenario, true);
  assert.deepEqual(all.map((row) => row.id), leftoverCoverageRows(scenario).map((row) => row.id));
  assert.equal(all.length, 4);
  assert.ok(coverage.secondary);
  assert.equal(shown.some((row) => row.id === "leftover-fill"), false);
  assert.equal(shown.some((row) => row.id === "leftover-after-winner"), true);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner.offer.id, winnerId);
  assert.equal(evaluateMarket(scenario).winner.fulfilledUnits, market.winner.fulfilledUnits);
  assert.equal(JSON.stringify(shown).includes("SECRET_LABEL"), false);
  assert.equal(JSON.stringify(shown).includes("selectedBuyerIds"), false);
});

test("hide covered leftover rows rejects prototype-like flags", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterLeftoverCoverageRowsHidingCovered(scenario, "true"), /true or false/);
  assert.throws(() => filterLeftoverCoverageRowsHidingCovered(scenario, 1), ScenarioError);
});

test("the organizer hide-covered leftover filter is not on the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="hide-covered-leftover-rows"/u);
  assert.match(buyerPanel, /Hide leftover rows that are fully covered/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("hide-covered-leftover-rows"), false);
  assert.match(app, /function applyLeftoverCoverageDisplayFilter\(/u);
  assert.match(app, /filterLeftoverCoverageRowsHidingCovered\(/u);
  assert.match(app, /hideCoveredLeftoverRows/u);
  assert.match(app, /persistWorkspaceDisplaySettings\(/u);
  assert.match(html, /Older workspace files without it still show every leftover row/u);
});
