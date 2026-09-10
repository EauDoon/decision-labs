import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clonePreset,
  leftoverCoverageRows,
  createLeftoverCoverageMarkdown,
  computeResidualCoverage,
  evaluateMarket,
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

test("leftover coverage rows are counts and merchant labels only", () => {
  const scenario = leftoverFixture();
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const coverage = computeResidualCoverage(scenario);
  const rows = leftoverCoverageRows(scenario);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].id, "leftover-after-winner");
  assert.equal(rows[0].buyerCount, coverage.leftoverBuyerCount);
  assert.equal(rows[0].units, coverage.leftoverUnits);
  assert.equal(rows[0].merchant, "Harbour Roasters");
  assert.equal(rows[1].stage, "Leftover fill");
  assert.equal(rows[1].merchant, "Leaf Collective");
  assert.equal(rows[1].buyerCount, coverage.secondary.deliveredBuyers);
  assert.equal(rows[1].units, coverage.secondary.fulfilledUnits);
  assert.equal(rows[2].merchant, "None");
  assert.equal(rows[3].id, "uncovered-leftover");
  assert.equal(rows[3].uncovered, coverage.leftoverBuyerCount > 0);
  const json = JSON.stringify(rows);
  assert.equal(json.includes("SECRET_LABEL"), false);
  assert.equal(json.includes("SECRET_ID"), false);
  assert.equal(json.includes("987654.32"), false);
  assert.equal(json.includes("maxUnitPrice"), false);
  assert.equal(json.includes("leftoverBuyerIds"), false);
  assert.equal(json.includes("selectedBuyerIds"), false);
  assert.equal(json.includes("allocations"), false);
});

test("leftover coverage Markdown is organizer-private counts after the winner", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverCoverageMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /not a merchant export/);
  assert.match(markdown, new RegExp(`Winning merchant: ${market.winner.offer.merchant}`));
  assert.match(markdown, new RegExp(`Leftover after winner: ${coverage.leftoverBuyerCount} buyers, ${coverage.leftoverUnits} units`));
  assert.match(markdown, /Leftover fill: Leaf Collective/);
  assert.match(markdown, /Tertiary fill: none/);
  assert.match(markdown, /Still unfilled:/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes('"selectedBuyerIds":'), false);
  assert.equal(markdown.includes('"allocations":'), false);
});

test("the buyer room copies leftover coverage with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-coverage"/u);
  assert.match(buyerPanel, /Copy leftover coverage \(organizer private\)/u);
  assert.match(buyerPanel, /id="clipboard-fallback-text"/u);
  assert.match(buyerPanel, /id="leftover-coverage-rows"/u);
  assert.match(buyerPanel, /organizer-private/u);
  assert.equal(merchantPanel.includes("copy-leftover-coverage"), false);
  assert.equal(merchantPanel.includes("clipboard-fallback-text"), false);
  assert.match(app, /createLeftoverCoverageMarkdown\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /clipboard-fallback-text/u);
});
