import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clonePreset,
  createLeftoverCoverageMarkdown,
  createUncoveredLeftoverCountsMarkdown,
  leftoverCoverageRows,
  computeResidualCoverage,
  evaluateMarket,
  validateScenario,
  createWinningMerchantLabelMarkdown,
  createLeftoverHeadroomMarkdown,
  createWinningFulfillmentMarkdown
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

test("uncovered leftover Markdown is organizer-private counts and units only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  scenario.offers[1].minimumUnits = 40;
  const markdown = createUncoveredLeftoverCountsMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /not a merchant export/);
  assert.match(markdown, new RegExp(`Uncovered leftover buyers: ${coverage.unfilledBuyerCount}`));
  assert.match(markdown, new RegExp(`Uncovered leftover units: ${coverage.unfilledUnits}`));
  assert.match(markdown, /Counts and units only/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes('"selectedBuyerIds":'), false);
  assert.equal(markdown.includes('"allocations":'), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Coffee annex"), false);
});

test("the buyer room copies uncovered leftover counts with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-uncovered-leftover"/u);
  assert.match(buyerPanel, /Copy uncovered leftover counts \(organizer private\)/u);
  assert.match(buyerPanel, /Uncovered leftover copy is counts and units only/u);
  assert.equal(merchantPanel.includes("copy-uncovered-leftover"), false);
  assert.match(app, /createUncoveredLeftoverCountsMarkdown\(/u);
  assert.match(app, /function copyUncoveredLeftoverCounts\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
});

test("the buyer room copies leftover coverage with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-coverage"/u);
  assert.match(buyerPanel, /Copy leftover coverage \(organizer private\)/u);
  assert.match(buyerPanel, /id="leftover-coverage-rows"/u);
  assert.match(buyerPanel, /organizer-private/u);
  assert.match(html, /id="clipboard-fallback-text"/u);
  assert.equal(merchantPanel.includes("copy-leftover-coverage"), false);
  assert.equal(merchantPanel.includes("clipboard-fallback-text"), false);
  assert.match(app, /createLeftoverCoverageMarkdown\(/u);
  assert.match(app, /function copyLeftoverCoverage\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /clipboard-fallback-text/u);
  assert.match(app, /if \(key === "c"\)/u);
});

test("winning merchant Markdown is the merchant label only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createWinningMerchantLabelMarkdown(scenario);
  const market = evaluateMarket(scenario);
  assert.match(markdown, /# Common Cart winning merchant/);
  assert.match(markdown, new RegExp(`^${market.winner.offer.merchant}$`, "m"));
  assert.match(markdown, /Merchant label only/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("8"), false);
});

test("winning merchant Markdown is honest when none unlocked", () => {
  const scenario = leftoverFixture();
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const markdown = createWinningMerchantLabelMarkdown(scenario);
  assert.match(markdown, /^None unlocked$/m);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
});

test("winning merchant copy sits next to leftover print and stays off the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const leftover = html.slice(html.indexOf('id="leftover-print-winner"'), html.indexOf('id="copy-leftover-coverage"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(leftover, /id="copy-winning-merchant"/u);
  assert.match(leftover, /Copy winning merchant label/u);
  assert.match(leftover, /Honest empty when none unlocked/u);
  assert.equal(merchantPanel.includes("copy-winning-merchant"), false);
  assert.match(app, /createWinningMerchantLabelMarkdown\(/u);
  assert.match(app, /function copyWinningMerchantLabel\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
});

test("leftover unspent item headroom Markdown is organizer-private currency and counts", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const leftover = createLeftoverHeadroomMarkdown(scenario);
  assert.equal(leftover.trim().includes("\n"), false);
  assert.match(leftover, /organizer private/);
  assert.match(leftover, /Not a rebate/);
  assert.match(leftover, /AUD /);
  assert.match(leftover, /included buyers/);
  assert.equal(leftover.includes("SECRET_TITLE"), false);
  assert.equal(leftover.includes("SECRET_LABEL"), false);
  assert.equal(leftover.includes("SECRET_ID"), false);
  assert.equal(leftover.includes("987654.32"), false);
  assert.equal(leftover.includes("maxUnitPrice"), false);
  assert.equal(leftover.includes("leftoverBuyerIds"), false);
  assert.equal(leftover.includes("Tea room"), false);
  assert.equal(leftover.includes("Harbour Roasters"), false);
});

test("leftover unspent item headroom Markdown is honest when none unlocked", () => {
  const scenario = leftoverFixture();
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const leftover = createLeftoverHeadroomMarkdown(scenario);
  assert.match(leftover, /: none\. Not a rebate\./);
  assert.equal(leftover.includes("SECRET_LABEL"), false);
  assert.equal(leftover.includes("Harbour Roasters"), false);
});

test("the buyer room copies leftover unspent item headroom with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-headroom"/u);
  assert.match(buyerPanel, /Copy leftover unspent item headroom \(organizer private\)/u);
  assert.match(buyerPanel, /Not a rebate/u);
  assert.equal(merchantPanel.includes("copy-leftover-headroom"), false);
  assert.match(app, /createLeftoverHeadroomMarkdown\(/u);
  assert.match(app, /function copyLeftoverHeadroom\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /if \(key === "i"\)/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
});

test("winning fulfillment Markdown is pickup or shipping only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createWinningFulfillmentMarkdown(scenario);
  const market = evaluateMarket(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /^Winning fulfillment: (pickup|shipping)$/m);
  assert.match(markdown, new RegExp(`Winning fulfillment: ${market.winner.offer.fulfillment}`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("winning fulfillment Markdown copies pickup when the winner is pickup", () => {
  const scenario = leftoverFixture();
  scenario.offers[0].fulfillment = "pickup";
  const markdown = createWinningFulfillmentMarkdown(scenario);
  assert.match(markdown, /^Winning fulfillment: pickup$/m);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
});

test("winning fulfillment Markdown is honest when none unlocked", () => {
  const scenario = leftoverFixture();
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const markdown = createWinningFulfillmentMarkdown(scenario);
  assert.match(markdown, /^Winning fulfillment: None unlocked$/m);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("pickup"), false);
  assert.equal(markdown.includes("shipping"), false);
});

test("winning fulfillment copy sits next to leftover print and stays off the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const leftover = html.slice(html.indexOf('id="leftover-print-winner"'), html.indexOf('id="copy-leftover-coverage"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(leftover, /id="copy-winning-fulfillment"/u);
  assert.match(leftover, /Copy winning fulfillment mode/u);
  assert.match(leftover, /Honest empty when none unlocked/u);
  assert.equal(merchantPanel.includes("copy-winning-fulfillment"), false);
  assert.match(app, /createWinningFulfillmentMarkdown\(/u);
  assert.match(app, /function copyWinningFulfillment\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
});
