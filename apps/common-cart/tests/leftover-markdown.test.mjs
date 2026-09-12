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
  createWinningFulfillmentMarkdown,
  createLeftoverFillMarkdown,
  createLeftoverFillUnitCountMarkdown,
  createLeftoverFillMerchantLabelMarkdown,
  createLeftoverFillRemainingCapacityMarkdown,
  createLeftoverFillFulfillmentMarkdown,
  createLeftoverFillDeliveryMarkdown,
  createLeftoverFillPickupMarkdown,
  createLeftoverFillLabelMarkdown,
  createLeftoverFillMinimumMarkdown,
  createLeftoverFillMaximumMarkdown,
  createTertiaryFillRemainingCapacityMarkdown,
  createTertiaryFillMaximumMarkdown,
  createWinningRemainingCapacityMarkdown,
  createRequestedUnitsMarkdown,
  createUncoveredLeftoverUnitCountMarkdown,
  createLeftoverUncoveredRemainingMarkdown,
  createLeftoverUncoveredMaximumMarkdown,
  createLeftoverUncoveredMinimumMarkdown,
  createLeftoverUncoveredCountMarkdown,
  createLeftoverUncoveredLeftoverOnlyCountMarkdown,
  createLeftoverUncoveredLeftoverOnlyRemainingMarkdown,
  createLeftoverUncoveredLeftoverOnlyMaximumMarkdown,
  createLeftoverUncoveredLeftoverOnlyMinimumMarkdown,
  createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown,
  createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown,
  createLeftoverUncoveredLeftoverOnlyCapacityMarkdown,
  createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown
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

test("leftover fill Markdown is organizer-private one-line merchant and counts", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverFillMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`${coverage.secondary.merchant}, ${coverage.secondary.deliveredBuyers} buyers, ${coverage.secondary.fulfilledUnits} units`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Tertiary"), false);
  assert.equal(markdown.includes("tertiary"), false);
});

test("leftover fill Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverFillMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("leftover fill unit-count Markdown is organizer-private count only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverFillUnitCountMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${coverage.secondary.fulfilledUnits}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("Tertiary"), false);
  assert.equal(markdown.includes("tertiary"), false);
});

test("leftover fill unit-count Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverFillUnitCountMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("leftover fill merchant Markdown is organizer-private merchant label only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverFillMerchantLabelMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${coverage.secondary.merchant}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("buyers,"), false);
  assert.equal(markdown.includes("units"), false);
  assert.equal(markdown.includes("Tertiary"), false);
  assert.equal(markdown.includes("tertiary"), false);
  assert.notEqual(markdown, createLeftoverFillMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createWinningMerchantLabelMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
});

test("leftover fill merchant Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverFillMerchantLabelMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("leftover fill remaining capacity Markdown is organizer-private count only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverFillRemainingCapacityMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === coverage.secondary.offerId);
  const remaining = leftoverOffer.capacity - coverage.secondary.fulfilledUnits;
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${remaining}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("Tertiary"), false);
  assert.equal(markdown.includes("tertiary"), false);
  assert.notEqual(markdown, createLeftoverFillMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMerchantLabelMarkdown(scenario));
  assert.notEqual(markdown, createWinningRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createTertiaryFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createTertiaryFillMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
});

test("leftover fill remaining capacity Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverFillRemainingCapacityMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("leftover fill fulfillment Markdown is organizer-private pickup or shipping", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverFillFulfillmentMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === coverage.secondary.offerId);
  const mode = leftoverOffer.fulfillment === "pickup" ? "pickup" : "shipping";
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${mode}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("Tertiary"), false);
  assert.equal(markdown.includes("tertiary"), false);
  assert.notEqual(markdown, createLeftoverFillMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMerchantLabelMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createWinningFulfillmentMarkdown(scenario));
});

test("leftover fill fulfillment Markdown copies pickup when leftover fill is pickup", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].fulfillment = "pickup";
  const markdown = createLeftoverFillFulfillmentMarkdown(scenario);
  assert.match(markdown, /: pickup\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
});

test("leftover fill fulfillment Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverFillFulfillmentMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("pickup"), false);
  assert.equal(markdown.includes("shipping"), false);
});

test("leftover fill delivery Markdown is organizer-private count only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverFillDeliveryMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === coverage.secondary.offerId);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOffer.deliveryDays}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("Tertiary"), false);
  assert.equal(markdown.includes("tertiary"), false);
  assert.notEqual(markdown, createLeftoverFillMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillFulfillmentMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillPickupMarkdown(scenario));
  assert.notEqual(markdown, createWinningFulfillmentMarkdown(scenario));
});

test("leftover fill delivery Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverFillDeliveryMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("leftover fill pickup Markdown is organizer-private count only when leftover fill is pickup", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].fulfillment = "pickup";
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverFillPickupMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === coverage.secondary.offerId);
  assert.equal(leftoverOffer.fulfillment, "pickup");
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOffer.deliveryDays}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("Tertiary"), false);
  assert.equal(markdown.includes("tertiary"), false);
  assert.notEqual(markdown, createLeftoverFillMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillFulfillmentMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillDeliveryMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillLabelMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMinimumMarkdown(scenario));
  assert.notEqual(markdown, createWinningFulfillmentMarkdown(scenario));
});

test("leftover fill pickup Markdown is honest when leftover fill is shipping", () => {
  const scenario = leftoverFixture();
  const markdown = createLeftoverFillPickupMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("leftover fill pickup Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverFillPickupMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("leftover fill label Markdown is organizer-private merchant and variant only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverFillLabelMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${coverage.secondary.merchant} / ${coverage.secondary.variant}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Tertiary"), false);
  assert.equal(markdown.includes("tertiary"), false);
  assert.notEqual(markdown, createLeftoverFillMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMerchantLabelMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillPickupMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillDeliveryMarkdown(scenario));
  assert.notEqual(markdown, createWinningMerchantLabelMarkdown(scenario));
});

test("leftover fill label Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverFillLabelMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("leftover fill minimum Markdown is organizer-private count only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverFillMinimumMarkdown(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === computeResidualCoverage(scenario).secondary.offerId);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOffer.minimumUnits}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Tertiary"), false);
  assert.equal(markdown.includes("tertiary"), false);
  assert.notEqual(markdown, createLeftoverFillMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMerchantLabelMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillLabelMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillPickupMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
});

test("leftover fill minimum Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverFillMinimumMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("leftover fill maximum Markdown is organizer-private leftover-fill offer capacity", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverFillMaximumMarkdown(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === computeResidualCoverage(scenario).secondary.offerId);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOffer.capacity}\\.`));
  assert.notEqual(leftoverOffer.capacity, leftoverOffer.minimumUnits);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Tertiary"), false);
  assert.equal(markdown.includes("tertiary"), false);
  assert.notEqual(markdown, createLeftoverFillMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillLabelMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createTertiaryFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createTertiaryFillMaximumMarkdown(scenario));
});

test("leftover fill maximum Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverFillMaximumMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("tertiary fill remaining capacity Markdown is organizer-private remaining-capacity only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createTertiaryFillRemainingCapacityMarkdown(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMaximumMarkdown(scenario));
});

test("tertiary fill remaining capacity Markdown reports leftover-capacity minus tertiary units", () => {
  const source = clonePreset("neighbourhood");
  const scenario = validateScenario({
    title: "Tertiary-fill fixture",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B05", label: "Juice stall", category: "Juice crates", quantity: 3, maxUnitPrice: 12, latestDeliveryDays: 9, allowedVariants: ["Orange juice"] },
      { ...source.buyers[0], id: "B06", label: "Biscuit stall", category: "Biscuit tins", quantity: 4, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] },
      { ...source.buyers[0], id: "B07", label: "Biscuit annex", category: "Biscuit tins", quantity: 3, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O03", merchant: "Biscuit Co-op", category: "Biscuit tins", variant: "Plain biscuit", unitPrice: 8, minimumUnits: 3, deliveryDays: 7, capacity: 20, shippingPerBuyer: 1 }
    ]
  });
  const coverage = computeResidualCoverage(scenario);
  assert.ok(coverage.tertiary);
  const tertiaryOffer = scenario.offers.find((offer) => offer.id === coverage.tertiary.offerId);
  const remaining = tertiaryOffer.capacity - coverage.tertiary.fulfilledUnits;
  const markdown = createTertiaryFillRemainingCapacityMarkdown(scenario);
  assert.match(markdown, new RegExp(`: ${remaining}\\.`));
  assert.equal(markdown.includes("Biscuit stall"), false);
  assert.equal(markdown.includes("B06"), false);
  assert.equal(markdown.includes("Biscuit Co-op"), false);
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMaximumMarkdown(scenario));
});

test("tertiary fill maximum Markdown is organizer-private tertiary-fill offer capacity", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createTertiaryFillMaximumMarkdown(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createTertiaryFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMaximumMarkdown(scenario));
});

test("tertiary fill maximum Markdown reports tertiary-fill offer capacity", () => {
  const source = clonePreset("neighbourhood");
  const scenario = validateScenario({
    title: "Tertiary-fill fixture",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B05", label: "Juice stall", category: "Juice crates", quantity: 3, maxUnitPrice: 12, latestDeliveryDays: 9, allowedVariants: ["Orange juice"] },
      { ...source.buyers[0], id: "B06", label: "Biscuit stall", category: "Biscuit tins", quantity: 4, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] },
      { ...source.buyers[0], id: "B07", label: "Biscuit annex", category: "Biscuit tins", quantity: 3, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O03", merchant: "Biscuit Co-op", category: "Biscuit tins", variant: "Plain biscuit", unitPrice: 8, minimumUnits: 3, deliveryDays: 7, capacity: 20, shippingPerBuyer: 1 }
    ]
  });
  const coverage = computeResidualCoverage(scenario);
  assert.ok(coverage.tertiary);
  const tertiaryOffer = scenario.offers.find((offer) => offer.id === coverage.tertiary.offerId);
  const markdown = createTertiaryFillMaximumMarkdown(scenario);
  assert.match(markdown, new RegExp(`: ${tertiaryOffer.capacity}\\.`));
  assert.equal(markdown.includes("Biscuit stall"), false);
  assert.equal(markdown.includes("B06"), false);
  assert.equal(markdown.includes("Biscuit Co-op"), false);
  assert.notEqual(markdown, createTertiaryFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMaximumMarkdown(scenario));
});

test("uncovered leftover unit-count Markdown is organizer-private count only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  scenario.offers[1].minimumUnits = 40;
  const markdown = createUncoveredLeftoverUnitCountMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${coverage.unfilledUnits}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("Uncovered leftover buyers"), false);
  assert.equal(markdown.includes("leftover fill units"), false);
});

test("uncovered leftover unit-count Markdown is honest when leftover is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createUncoveredLeftoverUnitCountMarkdown(scenario);
  assert.match(markdown, /: none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
});

test("leftover uncovered remaining Markdown is organizer-private remaining uncovered leftover units", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  scenario.offers[1].minimumUnits = 40;
  const markdown = createLeftoverUncoveredRemainingMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered remaining \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${coverage.unfilledUnits}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("leftover fill remaining"), false);
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createTertiaryFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createTertiaryFillMaximumMarkdown(scenario));
});

test("leftover uncovered remaining Markdown is honest when leftover is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createLeftoverUncoveredRemainingMarkdown(scenario);
  assert.match(markdown, /leftover uncovered remaining \(organizer private\): none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
});

test("leftover uncovered remaining Markdown stays distinct from leftover-fill remaining, tertiary remaining 1, tertiary maximum 4, and uncovered leftover unit-count", () => {
  const hockey = clonePreset("hockeyCarnivalLunch");
  const leftoverUncovered = createLeftoverUncoveredRemainingMarkdown(hockey);
  const leftoverFillRemaining = createLeftoverFillRemainingCapacityMarkdown(hockey);
  const tertiaryRemainingNone = createTertiaryFillRemainingCapacityMarkdown(hockey);
  const tertiaryMaximumNone = createTertiaryFillMaximumMarkdown(hockey);
  const uncoveredUnits = createUncoveredLeftoverUnitCountMarkdown(hockey);
  const hockeyCoverage = computeResidualCoverage(hockey);
  assert.equal(hockeyCoverage.unfilledUnits, 14);
  assert.match(leftoverUncovered, /: 14\./);
  assert.match(leftoverFillRemaining, /: 21\./);
  assert.notEqual(leftoverUncovered, leftoverFillRemaining);
  assert.notEqual(leftoverUncovered, tertiaryRemainingNone);
  assert.notEqual(leftoverUncovered, tertiaryMaximumNone);
  assert.notEqual(leftoverUncovered, uncoveredUnits);
  assert.notEqual(leftoverUncovered, createLeftoverUncoveredMaximumMarkdown(hockey));
  assert.notEqual(leftoverUncovered, createLeftoverUncoveredMinimumMarkdown(hockey));
  const source = clonePreset("neighbourhood");
  const scenario = validateScenario({
    title: "Tertiary remaining one",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B05", label: "Biscuit stall", category: "Biscuit tins", quantity: 3, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O03", merchant: "Biscuit Co-op", category: "Biscuit tins", variant: "Plain biscuit", unitPrice: 8, minimumUnits: 3, deliveryDays: 7, capacity: 4, shippingPerBuyer: 1 }
    ]
  });
  const coverage = computeResidualCoverage(scenario);
  assert.ok(coverage.tertiary);
  const tertiaryRemaining = createTertiaryFillRemainingCapacityMarkdown(scenario);
  const tertiaryMaximum = createTertiaryFillMaximumMarkdown(scenario);
  assert.equal(tertiaryRemaining, "Common Cart tertiary fill remaining capacity (organizer private): 1. Not a merchant export.\n");
  assert.equal(tertiaryMaximum, "Common Cart tertiary fill maximum (organizer private): 4. Not a merchant export.\n");
  const leftoverUncoveredTertiary = createLeftoverUncoveredRemainingMarkdown(scenario);
  assert.notEqual(leftoverUncoveredTertiary, tertiaryRemaining);
  assert.notEqual(leftoverUncoveredTertiary, tertiaryMaximum);
  assert.notEqual(leftoverUncoveredTertiary, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(leftoverUncoveredTertiary, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.equal(leftoverUncoveredTertiary.includes("Biscuit stall"), false);
  assert.equal(leftoverUncoveredTertiary.includes("B05"), false);
  assert.equal(leftoverUncoveredTertiary.includes("Biscuit Co-op"), false);
});

test("the buyer room copies leftover fill with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill"/u);
  assert.match(buyerPanel, /Copy leftover fill \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover fill copy is the secondary leftover merchant label/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill"), false);
  assert.match(app, /createLeftoverFillMarkdown\(/u);
  assert.match(app, /function copyLeftoverFill\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /if \(key === "y" \|\| key === ";"\)/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
});

test("the buyer room copies leftover fill unit-count with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-units"/u);
  assert.match(buyerPanel, /Copy leftover fill units \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover fill unit-count copy is count only/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-units"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill units"), false);
  assert.equal(merchantPanel.includes("Leftover fill unit-count copy"), false);
  assert.match(app, /createLeftoverFillUnitCountMarkdown\(/u);
  assert.match(app, /function copyLeftoverFillUnitCount\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(app, /if \(key === "'"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount\(\);/u);
  assert.match(app, /if \(key === "y" \|\| key === ";"\)/u);
});

test("the buyer room copies leftover fill merchant with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-merchant"/u);
  assert.match(buyerPanel, /Copy leftover fill merchant \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover fill merchant copy is merchant label only/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-merchant"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill merchant"), false);
  assert.equal(merchantPanel.includes("Leftover fill merchant copy"), false);
  assert.match(app, /createLeftoverFillMerchantLabelMarkdown\(/u);
  assert.match(app, /function copyLeftoverFillMerchantLabel\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Merchant label only\. This is not a merchant export/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-merchant"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-units"/u);
  assert.match(buyerPanel, /id="copy-uncovered-leftover-units"/u);
  assert.match(buyerPanel, /id="copy-winning-merchant"/u);
  assert.match(app, /if \(key === '"'\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMerchantLabel\(\);/u);
  assert.match(app, /if \(key === ":"\) \{\s*event\.preventDefault\(\);\s*copyUncoveredLeftoverUnitCount\(\);/u);
  assert.match(app, /if \(key === "'"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount\(\);/u);
});

test("the buyer room copies leftover fill remaining capacity with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-remaining"/u);
  assert.match(buyerPanel, /Copy leftover fill remaining capacity \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover fill remaining-capacity copy is remaining capacity on the leftover-fill offer/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-remaining"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill remaining capacity"), false);
  assert.equal(merchantPanel.includes("Leftover fill remaining-capacity copy"), false);
  assert.match(app, /createLeftoverFillRemainingCapacityMarkdown\(/u);
  assert.match(app, /function copyLeftoverFillRemainingCapacity\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Remaining capacity only\. This is not a merchant export/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-merchant"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-units"/u);
  assert.match(buyerPanel, /id="copy-winning-remaining-capacity"/u);
  assert.match(app, /if \(key === "\}"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillRemainingCapacity\(\);/u);
  assert.match(buyerPanel, /aria-keyshortcuts="\}"/u);
});

test("the buyer room copies leftover fill fulfillment with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-fulfillment"/u);
  assert.match(buyerPanel, /Copy leftover fill fulfillment \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover fill fulfillment copy is pickup or shipping on the leftover-fill offer/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-fulfillment"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill fulfillment"), false);
  assert.equal(merchantPanel.includes("Leftover fill fulfillment copy"), false);
  assert.match(app, /createLeftoverFillFulfillmentMarkdown\(/u);
  assert.match(app, /function copyLeftoverFillFulfillment\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Pickup or shipping only\. This is not a merchant export/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-merchant"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-remaining"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-units"/u);
  assert.match(buyerPanel, /id="copy-winning-fulfillment"/u);
  assert.match(app, /if \(key === "~"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillFulfillment\(\);/u);
  assert.match(html, /aria-keyshortcuts="~"/u);
});

test("the buyer room copies leftover fill delivery with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-delivery"/u);
  assert.match(buyerPanel, /Copy leftover fill delivery \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover fill delivery copy is leftover-fill delivery days as a count/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-delivery"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill delivery"), false);
  assert.equal(merchantPanel.includes("Leftover fill delivery copy"), false);
  assert.match(app, /createLeftoverFillDeliveryMarkdown\(/u);
  assert.match(app, /function copyLeftoverFillDelivery\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-fulfillment"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-remaining"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-units"/u);
  assert.match(app, /function copyLeftoverFillFulfillment\(/u);
  assert.match(app, /function copyLeftoverFillRemainingCapacity\(/u);
});

test("the buyer room copies leftover fill pickup with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-pickup"/u);
  assert.match(buyerPanel, /Copy leftover fill pickup \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover fill pickup copy is leftover-fill pickup days as a count when leftover fill is pickup/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-pickup"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill pickup"), false);
  assert.equal(merchantPanel.includes("Leftover fill pickup copy"), false);
  assert.match(app, /createLeftoverFillPickupMarkdown\(/u);
  assert.match(app, /function copyLeftoverFillPickup\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-delivery"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-fulfillment"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-remaining"/u);
  assert.match(app, /if \(key === "\*"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillPickup\(\);/u);
  assert.match(html, /aria-keyshortcuts="\*"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-units"/u);
  assert.match(app, /function copyLeftoverFillDelivery\(/u);
  assert.match(app, /function copyLeftoverFillFulfillment\(/u);
});

test("the buyer room copies leftover fill label with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-label"/u);
  assert.match(buyerPanel, /Copy leftover fill label \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover fill label copy is leftover-fill offer label as merchant and variant/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-label"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill label"), false);
  assert.equal(merchantPanel.includes("Leftover fill label copy"), false);
  assert.match(app, /createLeftoverFillLabelMarkdown\(/u);
  assert.match(app, /function copyLeftoverFillLabel\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Offer label only\. This is not a merchant export/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-pickup"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-merchant"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-remaining"/u);
  assert.match(app, /function copyLeftoverFillPickup\(/u);
  assert.match(app, /function copyLeftoverFillMerchantLabel\(/u);
  assert.match(app, /if \(key === "\$"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillLabel\(\);/u);
  assert.match(html, /aria-keyshortcuts="\$"/u);
});

test("the buyer room copies leftover fill minimum with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-minimum"/u);
  assert.match(buyerPanel, /Copy leftover fill minimum \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover fill minimum copy is leftover-fill offer minimum units as a count/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-minimum"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill minimum"), false);
  assert.equal(merchantPanel.includes("Leftover fill minimum copy"), false);
  assert.match(app, /createLeftoverFillMinimumMarkdown\(/u);
  assert.match(app, /function copyLeftoverFillMinimum\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-label"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-pickup"/u);
  assert.match(app, /if \(key === "5"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMinimum\(\);/u);
  assert.match(html, /aria-keyshortcuts="5"/u);
  assert.match(app, /function copyLeftoverFillLabel\(/u);
});

test("the buyer room copies leftover fill maximum with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-maximum"/u);
  assert.match(buyerPanel, /Copy leftover fill maximum \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover fill maximum copy is leftover-fill offer capacity as a count/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-maximum"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill maximum"), false);
  assert.equal(merchantPanel.includes("Leftover fill maximum copy"), false);
  assert.match(app, /createLeftoverFillMaximumMarkdown\(/u);
  assert.match(app, /function copyLeftoverFillMaximum\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-minimum"/u);
  assert.match(app, /if \(key === "8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMaximum\(\);/u);
  assert.match(html, /aria-keyshortcuts="8"/u);
  assert.match(app, /function copyLeftoverFillMinimum\(/u);
});

test("the buyer room copies tertiary fill remaining capacity with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-tertiary-fill-remaining"/u);
  assert.match(buyerPanel, /Copy tertiary fill remaining capacity \(organizer private\)/u);
  assert.match(buyerPanel, /Tertiary fill remaining-capacity copy is remaining capacity on the tertiary-fill offer/u);
  assert.equal(merchantPanel.includes("copy-tertiary-fill-remaining"), false);
  assert.equal(merchantPanel.includes("Copy tertiary fill remaining capacity"), false);
  assert.equal(merchantPanel.includes("Tertiary fill remaining-capacity copy"), false);
  assert.match(app, /createTertiaryFillRemainingCapacityMarkdown\(/u);
  assert.match(app, /function copyTertiaryFillRemainingCapacity\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-maximum"/u);
  assert.match(app, /if \(key === "1"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillRemainingCapacity\(\);/u);
  assert.match(html, /aria-keyshortcuts="1"/u);
  assert.match(app, /function copyLeftoverFillMaximum\(/u);
});

test("the buyer room copies tertiary fill maximum with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-tertiary-fill-maximum"/u);
  assert.match(buyerPanel, /Copy tertiary fill maximum \(organizer private\)/u);
  assert.match(buyerPanel, /Tertiary fill maximum copy is tertiary-fill offer capacity as a count/u);
  assert.equal(merchantPanel.includes("copy-tertiary-fill-maximum"), false);
  assert.equal(merchantPanel.includes("Copy tertiary fill maximum"), false);
  assert.equal(merchantPanel.includes("Tertiary fill maximum copy"), false);
  assert.match(app, /createTertiaryFillMaximumMarkdown\(/u);
  assert.match(app, /function copyTertiaryFillMaximum\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(buyerPanel, /id="copy-tertiary-fill-remaining"/u);
  assert.match(app, /if \(key === "4"\) \{\s*event\.preventDefault\(\);\s*copyTertiaryFillMaximum\(\);/u);
  assert.match(html, /aria-keyshortcuts="4"/u);
  assert.match(app, /function copyTertiaryFillRemainingCapacity\(/u);
});

test("the buyer room copies uncovered leftover unit-count with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-uncovered-leftover-units"/u);
  assert.match(buyerPanel, /Copy uncovered leftover units \(organizer private\)/u);
  assert.match(buyerPanel, /Uncovered leftover unit-count copy is count only/u);
  assert.equal(merchantPanel.includes("copy-uncovered-leftover-units"), false);
  assert.equal(merchantPanel.includes("Copy uncovered leftover units"), false);
  assert.equal(merchantPanel.includes("Uncovered leftover unit-count copy"), false);
  assert.match(buyerPanel, /id="copy-uncovered-leftover"/u);
  assert.match(buyerPanel, /id="copy-leftover-fill-units"/u);
  assert.match(app, /createUncoveredLeftoverUnitCountMarkdown\(/u);
  assert.match(app, /function copyUncoveredLeftoverUnitCount\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /function copyUncoveredLeftoverCounts\(/u);
  assert.match(app, /function copyLeftoverFillUnitCount\(/u);
  assert.match(app, /if \(key === ":"\) \{\s*event\.preventDefault\(\);\s*copyUncoveredLeftoverUnitCount\(\);/u);
});

test("the buyer room copies leftover uncovered remaining with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-remaining"/u);
  assert.match(buyerPanel, /Copy leftover uncovered remaining \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered remaining copy is remaining uncovered leftover units as a count/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-remaining"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered remaining"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered remaining copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-fill-remaining"/u);
  assert.match(buyerPanel, /id="copy-tertiary-fill-remaining"/u);
  assert.match(buyerPanel, /id="copy-uncovered-leftover-units"/u);
  assert.match(app, /createLeftoverUncoveredRemainingMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredRemaining\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(app, /if \(key === "PageUp"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredRemaining\(\);/u);
  assert.match(html, /aria-keyshortcuts="PageUp"/u);
});

test("leftover uncovered maximum Markdown is organizer-private leftover-fill offer capacity", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredMaximumMarkdown(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === computeResidualCoverage(scenario).secondary.offerId);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered maximum \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOffer.capacity}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverFillMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createTertiaryFillMaximumMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
});

test("leftover uncovered maximum Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverUncoveredMaximumMarkdown(scenario);
  assert.match(markdown, /leftover uncovered maximum \(organizer private\): none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
});

test("leftover uncovered maximum Markdown stays distinct from leftover-fill maximum, leftover uncovered remaining, tertiary maximum, and uncovered leftover unit-count even when the number matches", () => {
  const hockey = clonePreset("hockeyCarnivalLunch");
  const leftoverUncoveredMaximum = createLeftoverUncoveredMaximumMarkdown(hockey);
  const leftoverFillMaximum = createLeftoverFillMaximumMarkdown(hockey);
  const leftoverUncoveredRemaining = createLeftoverUncoveredRemainingMarkdown(hockey);
  const tertiaryMaximumNone = createTertiaryFillMaximumMarkdown(hockey);
  const uncoveredUnits = createUncoveredLeftoverUnitCountMarkdown(hockey);
  const leftoverOffer = hockey.offers.find((offer) => offer.id === computeResidualCoverage(hockey).secondary.offerId);
  assert.equal(leftoverOffer.capacity, 44);
  assert.match(leftoverUncoveredMaximum, /leftover uncovered maximum \(organizer private\): 44\./);
  assert.match(leftoverFillMaximum, /leftover fill maximum \(organizer private\): 44\./);
  assert.notEqual(leftoverUncoveredMaximum, leftoverFillMaximum);
  assert.notEqual(leftoverUncoveredMaximum, leftoverUncoveredRemaining);
  assert.notEqual(leftoverUncoveredMaximum, tertiaryMaximumNone);
  assert.notEqual(leftoverUncoveredMaximum, uncoveredUnits);
  const baseball = clonePreset("baseballCarnivalLunch");
  const baseballMaximum = createLeftoverUncoveredMaximumMarkdown(baseball);
  assert.match(baseballMaximum, /leftover uncovered maximum \(organizer private\): 44\./);
  assert.notEqual(baseballMaximum, createLeftoverFillMaximumMarkdown(baseball));
  assert.notEqual(baseballMaximum, createLeftoverUncoveredRemainingMarkdown(baseball));
  assert.notEqual(baseballMaximum, createLeftoverUncoveredMinimumMarkdown(baseball));
  const source = clonePreset("neighbourhood");
  const scenario = validateScenario({
    title: "Tertiary remaining one",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B05", label: "Biscuit stall", category: "Biscuit tins", quantity: 3, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O03", merchant: "Biscuit Co-op", category: "Biscuit tins", variant: "Plain biscuit", unitPrice: 8, minimumUnits: 3, deliveryDays: 7, capacity: 4, shippingPerBuyer: 1 }
    ]
  });
  const leftoverFillMaximumTertiary = createLeftoverFillMaximumMarkdown(scenario);
  const leftoverUncoveredMaximumTertiary = createLeftoverUncoveredMaximumMarkdown(scenario);
  const tertiaryMaximum = createTertiaryFillMaximumMarkdown(scenario);
  assert.equal(tertiaryMaximum, "Common Cart tertiary fill maximum (organizer private): 4. Not a merchant export.\n");
  assert.notEqual(leftoverUncoveredMaximumTertiary, leftoverFillMaximumTertiary);
  assert.notEqual(leftoverUncoveredMaximumTertiary, tertiaryMaximum);
  assert.notEqual(leftoverUncoveredMaximumTertiary, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(leftoverUncoveredMaximumTertiary, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.equal(leftoverUncoveredMaximumTertiary.includes("Biscuit stall"), false);
  assert.equal(leftoverUncoveredMaximumTertiary.includes("B05"), false);
  assert.equal(leftoverUncoveredMaximumTertiary.includes("Biscuit Co-op"), false);
});

test("the buyer room copies leftover uncovered maximum with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-maximum"/u);
  assert.match(buyerPanel, /Copy leftover uncovered maximum \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered maximum copy is leftover-fill offer capacity as a count/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-maximum"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered maximum"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered maximum copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-fill-maximum"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-remaining"/u);
  assert.match(buyerPanel, /id="copy-tertiary-fill-maximum"/u);
  assert.match(app, /createLeftoverUncoveredMaximumMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredMaximum\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(app, /if \(key === "Insert"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredMaximum\(\);/u);
  assert.match(html, /aria-keyshortcuts="Insert"/u);
});

test("leftover uncovered minimum Markdown is organizer-private leftover-fill offer minimum units", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredMinimumMarkdown(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === computeResidualCoverage(scenario).secondary.offerId);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered minimum \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOffer.minimumUnits}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverFillMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
});

test("leftover uncovered minimum Markdown is honest when leftover fill is missing", () => {
  const scenario = leftoverFixture();
  scenario.offers[1].minimumUnits = 5000;
  const markdown = createLeftoverUncoveredMinimumMarkdown(scenario);
  assert.match(markdown, /leftover uncovered minimum \(organizer private\): none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
});

test("leftover uncovered minimum Markdown stays distinct from leftover-fill minimum, leftover uncovered remaining, leftover uncovered maximum, and uncovered leftover unit-count even when the number matches", () => {
  const hockey = clonePreset("hockeyCarnivalLunch");
  const leftoverUncoveredMinimum = createLeftoverUncoveredMinimumMarkdown(hockey);
  const leftoverFillMinimum = createLeftoverFillMinimumMarkdown(hockey);
  const leftoverUncoveredRemaining = createLeftoverUncoveredRemainingMarkdown(hockey);
  const leftoverUncoveredMaximum = createLeftoverUncoveredMaximumMarkdown(hockey);
  const uncoveredUnits = createUncoveredLeftoverUnitCountMarkdown(hockey);
  const leftoverOffer = hockey.offers.find((offer) => offer.id === computeResidualCoverage(hockey).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 13);
  assert.match(leftoverUncoveredMinimum, /leftover uncovered minimum \(organizer private\): 13\./);
  assert.match(leftoverFillMinimum, /leftover fill minimum \(organizer private\): 13\./);
  assert.notEqual(leftoverUncoveredMinimum, leftoverFillMinimum);
  assert.notEqual(leftoverUncoveredMinimum, leftoverUncoveredRemaining);
  assert.notEqual(leftoverUncoveredMinimum, leftoverUncoveredMaximum);
  assert.notEqual(leftoverUncoveredMinimum, uncoveredUnits);
  const baseball = clonePreset("baseballCarnivalLunch");
  const baseballMinimum = createLeftoverUncoveredMinimumMarkdown(baseball);
  assert.match(baseballMinimum, /leftover uncovered minimum \(organizer private\): 14\./);
  assert.notEqual(baseballMinimum, createLeftoverFillMinimumMarkdown(baseball));
  assert.notEqual(baseballMinimum, createLeftoverUncoveredRemainingMarkdown(baseball));
  assert.notEqual(baseballMinimum, createLeftoverUncoveredMaximumMarkdown(baseball));
  const softball = clonePreset("softballCarnivalLunch");
  const softballMinimum = createLeftoverUncoveredMinimumMarkdown(softball);
  assert.match(softballMinimum, /leftover uncovered minimum \(organizer private\): 15\./);
  assert.notEqual(softballMinimum, createLeftoverFillMinimumMarkdown(softball));
  assert.notEqual(softballMinimum, createLeftoverUncoveredRemainingMarkdown(softball));
  assert.notEqual(softballMinimum, createLeftoverUncoveredMaximumMarkdown(softball));
  const source = clonePreset("neighbourhood");
  const scenario = validateScenario({
    title: "Tertiary remaining one",
    currency: "AUD",
    buyers: [
      { ...source.buyers[0], id: "B01", label: "Coffee hall", category: "Coffee beans", quantity: 8, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B02", label: "Coffee annex", category: "Coffee beans", quantity: 4, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Medium roast"] },
      { ...source.buyers[0], id: "B03", label: "Tea room", category: "Tea tins", quantity: 5, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B04", label: "Tea loft", category: "Tea tins", quantity: 4, maxUnitPrice: 18, latestDeliveryDays: 10, allowedVariants: ["Black tea"] },
      { ...source.buyers[0], id: "B05", label: "Biscuit stall", category: "Biscuit tins", quantity: 3, maxUnitPrice: 10, latestDeliveryDays: 9, allowedVariants: ["Plain biscuit"] }
    ],
    offers: [
      { ...source.offers[0], id: "O01", merchant: "Harbour Roasters", category: "Coffee beans", variant: "Medium roast", unitPrice: 24, minimumUnits: 10, deliveryDays: 5, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O02", merchant: "Leaf Collective", category: "Tea tins", variant: "Black tea", unitPrice: 14, minimumUnits: 6, deliveryDays: 8, capacity: 20, shippingPerBuyer: 1 },
      { ...source.offers[0], id: "O03", merchant: "Biscuit Co-op", category: "Biscuit tins", variant: "Plain biscuit", unitPrice: 8, minimumUnits: 3, deliveryDays: 7, capacity: 4, shippingPerBuyer: 1 }
    ]
  });
  const leftoverFillMinimumTertiary = createLeftoverFillMinimumMarkdown(scenario);
  const leftoverUncoveredMinimumTertiary = createLeftoverUncoveredMinimumMarkdown(scenario);
  const leftoverUncoveredMaximumTertiary = createLeftoverUncoveredMaximumMarkdown(scenario);
  assert.notEqual(leftoverUncoveredMinimumTertiary, leftoverFillMinimumTertiary);
  assert.notEqual(leftoverUncoveredMinimumTertiary, leftoverUncoveredMaximumTertiary);
  assert.notEqual(leftoverUncoveredMinimumTertiary, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(leftoverUncoveredMinimumTertiary, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.equal(leftoverUncoveredMinimumTertiary.includes("Biscuit stall"), false);
  assert.equal(leftoverUncoveredMinimumTertiary.includes("B05"), false);
  assert.equal(leftoverUncoveredMinimumTertiary.includes("Biscuit Co-op"), false);
});

test("the buyer room copies leftover uncovered minimum with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-minimum"/u);
  assert.match(buyerPanel, /Copy leftover uncovered minimum \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered minimum copy is leftover-fill offer minimum units as a count/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-minimum"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered minimum"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered minimum copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-fill-minimum"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-remaining"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-maximum"/u);
  assert.match(app, /createLeftoverUncoveredMinimumMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredMinimum\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(app, /if \(key === "Delete"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredMinimum\(\);/u);
  assert.match(html, /aria-keyshortcuts="Delete"/u);
});

test("leftover uncovered count Markdown is organizer-private uncovered leftover buyer count", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredCountMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered count \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${coverage.unfilledBuyerCount}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverCountsMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
});

test("leftover uncovered count Markdown is honest when leftover after the winner is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createLeftoverUncoveredCountMarkdown(scenario);
  assert.match(markdown, /leftover uncovered count \(organizer private\): none\. Not a merchant export\./);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
});

test("water polo carnival leftover uncovered count stays distinct from leftover uncovered minimum", () => {
  const waterPolo = clonePreset("waterPoloCarnivalLunch");
  const leftoverUncoveredCount = createLeftoverUncoveredCountMarkdown(waterPolo);
  const leftoverUncoveredMinimum = createLeftoverUncoveredMinimumMarkdown(waterPolo);
  const leftoverUncoveredRemaining = createLeftoverUncoveredRemainingMarkdown(waterPolo);
  const leftoverUncoveredMaximum = createLeftoverUncoveredMaximumMarkdown(waterPolo);
  const leftoverOffer = waterPolo.offers.find((offer) => offer.id === computeResidualCoverage(waterPolo).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 16);
  assert.match(leftoverUncoveredMinimum, /leftover uncovered minimum \(organizer private\): 16\./);
  assert.match(leftoverUncoveredCount, /leftover uncovered count \(organizer private\): /);
  assert.notEqual(leftoverUncoveredCount, leftoverUncoveredMinimum);
  assert.notEqual(leftoverUncoveredCount, leftoverUncoveredRemaining);
  assert.notEqual(leftoverUncoveredCount, leftoverUncoveredMaximum);
  assert.notEqual(leftoverUncoveredCount, createUncoveredLeftoverUnitCountMarkdown(waterPolo));
  const softball = clonePreset("softballCarnivalLunch");
  const softballMinimum = createLeftoverUncoveredMinimumMarkdown(softball);
  assert.match(softballMinimum, /leftover uncovered minimum \(organizer private\): 15\./);
  assert.notEqual(createLeftoverUncoveredCountMarkdown(softball), softballMinimum);
});

test("the buyer room copies leftover uncovered count with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-count"/u);
  assert.match(buyerPanel, /Copy leftover uncovered count \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered count copy is uncovered leftover buyer count/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-count"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered count"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered count copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-minimum"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-remaining"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-maximum"/u);
  assert.match(app, /createLeftoverUncoveredCountMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredCount\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(app, /if \(key === "F3"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredCount\(\);/u);
  assert.match(html, /aria-keyshortcuts="F3"/u);
});

test("leftover uncovered leftover-only count Markdown is organizer-private leftover-only buyer count", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const leftoverOnlyCount = (coverage.secondary?.selectedBuyerIds ?? []).length + (coverage.tertiary?.selectedBuyerIds ?? []).length;
  assert.ok(coverage.leftoverBuyerCount > 0);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOnlyCount}\\.`));
  assert.doesNotMatch(markdown, /leftover uncovered count \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverCountsMarkdown(scenario));
});

test("leftover uncovered leftover-only count Markdown is honest when leftover after the winner is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario);
  assert.match(markdown, /leftover uncovered leftover-only count \(organizer private\): none\. Not a merchant export\./);
  assert.doesNotMatch(markdown, /leftover uncovered count \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
});

test("rowing carnival leftover uncovered leftover-only count stays distinct from leftover uncovered count", () => {
  const rowing = clonePreset("rowingCarnivalLunch");
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(rowing);
  const leftoverUncoveredCount = createLeftoverUncoveredCountMarkdown(rowing);
  const leftoverUncoveredMinimum = createLeftoverUncoveredMinimumMarkdown(rowing);
  const leftoverUncoveredRemaining = createLeftoverUncoveredRemainingMarkdown(rowing);
  const leftoverUncoveredMaximum = createLeftoverUncoveredMaximumMarkdown(rowing);
  const leftoverOffer = rowing.offers.find((offer) => offer.id === computeResidualCoverage(rowing).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 17);
  assert.match(leftoverUncoveredMinimum, /leftover uncovered minimum \(organizer private\): 17\./);
  assert.match(leftoverOnlyCount, /leftover uncovered leftover-only count \(organizer private\): /);
  assert.notEqual(leftoverOnlyCount, leftoverUncoveredCount);
  assert.notEqual(leftoverOnlyCount, leftoverUncoveredMinimum);
  assert.notEqual(leftoverOnlyCount, leftoverUncoveredRemaining);
  assert.notEqual(leftoverOnlyCount, leftoverUncoveredMaximum);
  assert.notEqual(leftoverOnlyCount, createUncoveredLeftoverUnitCountMarkdown(rowing));
  const waterPolo = clonePreset("waterPoloCarnivalLunch");
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyCountMarkdown(waterPolo), createLeftoverUncoveredCountMarkdown(waterPolo));
});

test("the buyer room copies leftover uncovered leftover-only count with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-count"/u);
  assert.match(buyerPanel, /Copy leftover uncovered leftover-only count \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only count copy is leftover-only buyer count/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-count"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only count"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only count copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-count"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-minimum"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-remaining"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-maximum"/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyCountMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyCount\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(app, /if \(key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyCount\(\);/u);
  assert.match(html, /aria-keyshortcuts="F7"/u);
});

test("leftover uncovered leftover-only remaining Markdown is organizer-private leftover-only buyer units", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const leftoverOnlyUnits = scenario.buyers
    .filter((buyer) => [...(coverage.secondary?.selectedBuyerIds ?? []), ...(coverage.tertiary?.selectedBuyerIds ?? [])].includes(buyer.id))
    .reduce((sum, buyer) => sum + buyer.quantity, 0);
  assert.ok(coverage.leftoverBuyerCount > 0);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOnlyUnits}\\.`));
  assert.doesNotMatch(markdown, /leftover uncovered remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverCountsMarkdown(scenario));
});

test("leftover uncovered leftover-only remaining Markdown is honest when leftover after the winner is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario);
  assert.match(markdown, /leftover uncovered leftover-only remaining \(organizer private\): none\. Not a merchant export\./);
  assert.doesNotMatch(markdown, /leftover uncovered remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
});

test("sailing carnival leftover uncovered leftover-only remaining stays distinct from leftover uncovered remaining", () => {
  const sailing = clonePreset("sailingCarnivalLunch");
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(sailing);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(sailing);
  const leftoverUncoveredCount = createLeftoverUncoveredCountMarkdown(sailing);
  const leftoverUncoveredMinimum = createLeftoverUncoveredMinimumMarkdown(sailing);
  const leftoverUncoveredRemaining = createLeftoverUncoveredRemainingMarkdown(sailing);
  const leftoverUncoveredMaximum = createLeftoverUncoveredMaximumMarkdown(sailing);
  const leftoverOffer = sailing.offers.find((offer) => offer.id === computeResidualCoverage(sailing).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 18);
  assert.match(leftoverUncoveredMinimum, /leftover uncovered minimum \(organizer private\): 18\./);
  assert.match(leftoverOnlyRemaining, /leftover uncovered leftover-only remaining \(organizer private\): 23\./);
  assert.match(leftoverUncoveredRemaining, /leftover uncovered remaining \(organizer private\): 14\./);
  assert.notEqual(leftoverOnlyRemaining, leftoverOnlyCount);
  assert.notEqual(leftoverOnlyRemaining, leftoverUncoveredCount);
  assert.notEqual(leftoverOnlyRemaining, leftoverUncoveredMinimum);
  assert.notEqual(leftoverOnlyRemaining, leftoverUncoveredRemaining);
  assert.notEqual(leftoverOnlyRemaining, leftoverUncoveredMaximum);
  assert.notEqual(leftoverOnlyRemaining, createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(sailing));
  assert.notEqual(leftoverOnlyRemaining, createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(sailing));
  assert.notEqual(leftoverOnlyRemaining, createUncoveredLeftoverUnitCountMarkdown(sailing));
  const rowing = clonePreset("rowingCarnivalLunch");
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(rowing), createLeftoverUncoveredRemainingMarkdown(rowing));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(rowing), createLeftoverUncoveredLeftoverOnlyCountMarkdown(rowing));
});

test("the buyer room copies leftover uncovered leftover-only remaining with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-remaining"/u);
  assert.match(buyerPanel, /Copy leftover uncovered leftover-only remaining \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only remaining copy is leftover-only buyer units after the winner/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-remaining"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only remaining"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only remaining copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-count"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-count"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-remaining"/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyRemainingMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyRemaining\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(app, /if \(key === "F10"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyRemaining\(\);/u);
  assert.match(html, /aria-keyshortcuts="F10"/u);
});

test("leftover uncovered leftover-only maximum Markdown is organizer-private leftover-only buyer quantity maximum", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = new Set(market.winner?.selectedBuyerIds ?? []);
  const leftoverOnly = new Set();
  for (const id of [...(coverage.secondary?.selectedBuyerIds ?? []), ...(coverage.tertiary?.selectedBuyerIds ?? [])]) {
    if (!winnerIds.has(id)) leftoverOnly.add(id);
  }
  const leftoverOnlyMaximum = scenario.buyers
    .filter((buyer) => leftoverOnly.has(buyer.id))
    .reduce((maximum, buyer) => Math.max(maximum, buyer.quantity), 0);
  assert.ok(coverage.leftoverBuyerCount > 0);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOnlyMaximum}\\.`));
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered maximum \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverCountsMarkdown(scenario));
});

test("leftover uncovered leftover-only maximum Markdown is honest when leftover after the winner is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(scenario);
  assert.match(markdown, /leftover uncovered leftover-only maximum \(organizer private\): none\. Not a merchant export\./);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
});

test("canoeing carnival leftover uncovered leftover-only maximum stays distinct from leftover uncovered leftover-only remaining", () => {
  const canoeing = clonePreset("canoeingCarnivalLunch");
  const leftoverOnlyMaximum = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(canoeing);
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(canoeing);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(canoeing);
  const leftoverUncoveredCount = createLeftoverUncoveredCountMarkdown(canoeing);
  const leftoverUncoveredMinimum = createLeftoverUncoveredMinimumMarkdown(canoeing);
  const leftoverUncoveredRemaining = createLeftoverUncoveredRemainingMarkdown(canoeing);
  const leftoverUncoveredMaximum = createLeftoverUncoveredMaximumMarkdown(canoeing);
  const leftoverOffer = canoeing.offers.find((offer) => offer.id === computeResidualCoverage(canoeing).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 19);
  assert.notEqual(leftoverOffer.unitPrice, leftoverOffer.minimumUnits);
  assert.match(leftoverUncoveredMinimum, /leftover uncovered minimum \(organizer private\): 19\./);
  assert.match(leftoverOnlyMaximum, /leftover uncovered leftover-only maximum \(organizer private\): 13\./);
  assert.match(leftoverOnlyRemaining, /leftover uncovered leftover-only remaining \(organizer private\): 23\./);
  assert.notEqual(leftoverOnlyMaximum, leftoverOnlyRemaining);
  assert.notEqual(leftoverOnlyMaximum, leftoverOnlyCount);
  assert.notEqual(leftoverOnlyMaximum, leftoverUncoveredCount);
  assert.notEqual(leftoverOnlyMaximum, leftoverUncoveredMinimum);
  assert.notEqual(leftoverOnlyMaximum, leftoverUncoveredRemaining);
  assert.notEqual(leftoverOnlyMaximum, leftoverUncoveredMaximum);
  assert.notEqual(leftoverOnlyMaximum, createUncoveredLeftoverUnitCountMarkdown(canoeing));
  const sailing = clonePreset("sailingCarnivalLunch");
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(sailing), createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(sailing));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(sailing), createLeftoverUncoveredLeftoverOnlyCountMarkdown(sailing));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(sailing), createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(sailing));
});

test("the buyer room copies leftover uncovered leftover-only maximum with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-maximum"/u);
  assert.match(buyerPanel, /Copy leftover uncovered leftover-only maximum \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only maximum copy is the largest leftover-only buyer quantity/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-maximum"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only maximum"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only maximum copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-remaining"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-count"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-remaining"/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyMaximumMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyMaximum\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(app, /if \(event\.shiftKey && key === "F10"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyMaximum\(\);/u);
  assert.match(html, /aria-keyshortcuts="Shift\+F10"/u);
});

test("leftover uncovered leftover-only minimum Markdown is organizer-private leftover-only buyer quantity minimum", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = new Set(market.winner?.selectedBuyerIds ?? []);
  const leftoverOnly = new Set();
  for (const id of [...(coverage.secondary?.selectedBuyerIds ?? []), ...(coverage.tertiary?.selectedBuyerIds ?? [])]) {
    if (!winnerIds.has(id)) leftoverOnly.add(id);
  }
  const leftoverOnlyMinimum = scenario.buyers
    .filter((buyer) => leftoverOnly.has(buyer.id))
    .reduce((minimum, buyer) => Math.min(minimum, buyer.quantity), Number.POSITIVE_INFINITY);
  assert.ok(coverage.leftoverBuyerCount > 0);
  assert.equal(Number.isFinite(leftoverOnlyMinimum), true);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOnlyMinimum}\\.`));
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered minimum \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverCountsMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(scenario));
});

test("leftover uncovered leftover-only minimum Markdown is honest when leftover after the winner is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(scenario);
  assert.match(markdown, /leftover uncovered leftover-only minimum \(organizer private\): none\. Not a merchant export\./);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered minimum \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
});

test("kayaking carnival leftover uncovered leftover-only minimum stays distinct from leftover uncovered leftover-only maximum", () => {
  const kayaking = clonePreset("kayakingCarnivalLunch");
  const leftoverOnlyMinimum = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(kayaking);
  const leftoverOnlyMaximum = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(kayaking);
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(kayaking);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(kayaking);
  const leftoverUncoveredCount = createLeftoverUncoveredCountMarkdown(kayaking);
  const leftoverUncoveredMinimum = createLeftoverUncoveredMinimumMarkdown(kayaking);
  const leftoverUncoveredRemaining = createLeftoverUncoveredRemainingMarkdown(kayaking);
  const leftoverUncoveredMaximum = createLeftoverUncoveredMaximumMarkdown(kayaking);
  const leftoverOffer = kayaking.offers.find((offer) => offer.id === computeResidualCoverage(kayaking).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 20);
  assert.notEqual(leftoverOffer.unitPrice, leftoverOffer.minimumUnits);
  assert.match(leftoverUncoveredMinimum, /leftover uncovered minimum \(organizer private\): 20\./);
  assert.match(leftoverOnlyMinimum, /leftover uncovered leftover-only minimum \(organizer private\): 10\./);
  assert.match(leftoverOnlyMaximum, /leftover uncovered leftover-only maximum \(organizer private\): 13\./);
  assert.match(leftoverOnlyRemaining, /leftover uncovered leftover-only remaining \(organizer private\): 23\./);
  assert.notEqual(leftoverOnlyMinimum, leftoverOnlyMaximum);
  assert.notEqual(leftoverOnlyMinimum, leftoverOnlyRemaining);
  assert.notEqual(leftoverOnlyMinimum, leftoverOnlyCount);
  assert.notEqual(leftoverOnlyMinimum, leftoverUncoveredCount);
  assert.notEqual(leftoverOnlyMinimum, leftoverUncoveredMinimum);
  assert.notEqual(leftoverOnlyMinimum, leftoverUncoveredRemaining);
  assert.notEqual(leftoverOnlyMinimum, leftoverUncoveredMaximum);
  assert.notEqual(leftoverOnlyMinimum, createUncoveredLeftoverUnitCountMarkdown(kayaking));
  assert.notEqual(leftoverOnlyMinimum, createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(kayaking));
  const canoeing = clonePreset("canoeingCarnivalLunch");
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(canoeing), createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(canoeing));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(canoeing), createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(canoeing));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(canoeing), createLeftoverUncoveredLeftoverOnlyCountMarkdown(canoeing));
});

test("the buyer room copies leftover uncovered leftover-only minimum with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-minimum"/u);
  assert.match(buyerPanel, /Copy leftover uncovered leftover-only minimum \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only minimum copy is the smallest leftover-only buyer quantity/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-minimum"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only minimum"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only minimum copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-maximum"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-remaining"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-count"/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyMinimumMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyMinimum\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyMinimum\(\);/u);
});

test("leftover uncovered leftover-only headroom Markdown is organizer-private leftover-fill remaining after leftover-only units", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === coverage.secondary.offerId);
  const market = evaluateMarket(scenario);
  const winnerIds = new Set(market.winner?.selectedBuyerIds ?? []);
  const leftoverOnly = new Set();
  for (const id of [...(coverage.secondary?.selectedBuyerIds ?? []), ...(coverage.tertiary?.selectedBuyerIds ?? [])]) {
    if (!winnerIds.has(id)) leftoverOnly.add(id);
  }
  const leftoverOnlyUnits = scenario.buyers
    .filter((buyer) => leftoverOnly.has(buyer.id))
    .reduce((sum, buyer) => sum + buyer.quantity, 0);
  const leftoverOnlyHeadroom = leftoverOffer.capacity - leftoverOnlyUnits;
  assert.ok(coverage.leftoverBuyerCount > 0);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOffer.unitPrice);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOnlyHeadroom}\\.`));
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered minimum \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverHeadroomMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(scenario));
});

test("leftover uncovered leftover-only headroom Markdown is honest when leftover after the winner is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(scenario);
  assert.match(markdown, /leftover uncovered leftover-only headroom \(organizer private\): none\. Not a merchant export\./);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered remaining \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
});

test("dragon boat carnival leftover uncovered leftover-only headroom stays distinct and is not leftover unit price", () => {
  const dragonBoat = clonePreset("dragonBoatCarnivalLunch");
  const leftoverOnlyHeadroom = createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(dragonBoat);
  const leftoverOnlyMinimum = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(dragonBoat);
  const leftoverOnlyMaximum = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(dragonBoat);
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(dragonBoat);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(dragonBoat);
  const leftoverUncoveredCount = createLeftoverUncoveredCountMarkdown(dragonBoat);
  const leftoverUncoveredMinimum = createLeftoverUncoveredMinimumMarkdown(dragonBoat);
  const leftoverUncoveredRemaining = createLeftoverUncoveredRemainingMarkdown(dragonBoat);
  const leftoverUncoveredMaximum = createLeftoverUncoveredMaximumMarkdown(dragonBoat);
  const leftoverOffer = dragonBoat.offers.find((offer) => offer.id === computeResidualCoverage(dragonBoat).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 21);
  assert.notEqual(leftoverOffer.unitPrice, leftoverOffer.minimumUnits);
  assert.match(leftoverUncoveredMinimum, /leftover uncovered minimum \(organizer private\): 21\./);
  assert.match(leftoverOnlyHeadroom, /leftover uncovered leftover-only headroom \(organizer private\): 21\./);
  assert.match(leftoverOnlyMinimum, /leftover uncovered leftover-only minimum \(organizer private\): 10\./);
  assert.match(leftoverOnlyMaximum, /leftover uncovered leftover-only maximum \(organizer private\): 13\./);
  assert.match(leftoverOnlyRemaining, /leftover uncovered leftover-only remaining \(organizer private\): 23\./);
  assert.notEqual(21, leftoverOffer.unitPrice);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyMinimum);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyMaximum);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyRemaining);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyCount);
  assert.notEqual(leftoverOnlyHeadroom, leftoverUncoveredCount);
  assert.notEqual(leftoverOnlyHeadroom, leftoverUncoveredMinimum);
  assert.notEqual(leftoverOnlyHeadroom, leftoverUncoveredRemaining);
  assert.notEqual(leftoverOnlyHeadroom, leftoverUncoveredMaximum);
  assert.notEqual(leftoverOnlyHeadroom, createUncoveredLeftoverUnitCountMarkdown(dragonBoat));
  assert.notEqual(leftoverOnlyHeadroom, createLeftoverFillRemainingCapacityMarkdown(dragonBoat));
  assert.notEqual(leftoverOnlyHeadroom, createLeftoverHeadroomMarkdown(dragonBoat));
  assert.notEqual(leftoverOnlyHeadroom, createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(dragonBoat));
  const kayaking = clonePreset("kayakingCarnivalLunch");
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(kayaking), createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(kayaking));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(kayaking), createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(kayaking));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(kayaking), createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(kayaking));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(kayaking), createLeftoverUncoveredLeftoverOnlyCountMarkdown(kayaking));
});

test("the buyer room copies leftover uncovered leftover-only headroom with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-headroom"/u);
  assert.match(buyerPanel, /Copy leftover uncovered leftover-only headroom \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only headroom copy is leftover-fill remaining capacity after leftover-only units/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-headroom"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only headroom"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only headroom copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-minimum"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-maximum"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-remaining"/u);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-count"/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyHeadroom\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(app, /if \(event\.shiftKey && key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyAllocated\(\);/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-allocated"[^>]*aria-keyshortcuts="Shift\+F7"/u);
  assert.doesNotMatch(html, /id="copy-leftover-uncovered-leftover-only-headroom"[^>]*aria-keyshortcuts="Shift\+F7"/u);
});

test("leftover uncovered leftover-only allocated Markdown is organizer-private leftover-only units assigned onto leftover-fill", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const market = evaluateMarket(scenario);
  const winnerIds = new Set(market.winner?.selectedBuyerIds ?? []);
  const leftoverOnly = new Set();
  for (const id of [...(coverage.secondary?.selectedBuyerIds ?? []), ...(coverage.tertiary?.selectedBuyerIds ?? [])]) {
    if (!winnerIds.has(id)) leftoverOnly.add(id);
  }
  const leftoverOnlyUnits = scenario.buyers
    .filter((buyer) => leftoverOnly.has(buyer.id))
    .reduce((sum, buyer) => sum + buyer.quantity, 0);
  assert.ok(coverage.leftoverBuyerCount > 0);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered leftover-only allocated \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOnlyUnits}\\.`));
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only capacity \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered remaining \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
});

test("leftover uncovered leftover-only allocated Markdown is honest when leftover after the winner is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(scenario);
  assert.match(markdown, /leftover uncovered leftover-only allocated \(organizer private\): none\. Not a merchant export\./);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only capacity \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
});

test("surf carnival leftover uncovered leftover-only allocated stays distinct from leftover unit price, leftover minimum, and leftover-only headroom", () => {
  const surf = clonePreset("surfCarnivalLunch");
  const leftoverOnlyAllocated = createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(surf);
  const leftoverOnlyHeadroom = createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(surf);
  const leftoverOnlyMinimum = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(surf);
  const leftoverOnlyMaximum = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(surf);
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(surf);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(surf);
  const leftoverOffer = surf.offers.find((offer) => offer.id === computeResidualCoverage(surf).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 22);
  assert.equal(leftoverOffer.unitPrice, 17);
  assert.match(leftoverOnlyAllocated, /leftover uncovered leftover-only allocated \(organizer private\): 23\./);
  assert.match(leftoverOnlyHeadroom, /leftover uncovered leftover-only headroom \(organizer private\): 21\./);
  assert.notEqual(23, leftoverOffer.unitPrice);
  assert.notEqual(23, leftoverOffer.minimumUnits);
  assert.notEqual(23, 21);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyHeadroom);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyMinimum);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyMaximum);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyRemaining);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyCount);
  const leftoverOnlyCapacity = createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(surf);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyCapacity);
  const dragonBoat = clonePreset("dragonBoatCarnivalLunch");
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(dragonBoat), createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(dragonBoat));
});

test("the buyer room copies leftover uncovered leftover-only allocated with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-allocated"/u);
  assert.match(buyerPanel, /Copy leftover uncovered leftover-only allocated \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only allocated copy is leftover-only units assigned onto leftover-fill/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-allocated"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only allocated"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only allocated copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-headroom"/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyAllocated\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.match(app, /if \(event\.shiftKey && key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyAllocated\(\);/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-allocated"[^>]*aria-keyshortcuts="Shift\+F7"/u);
});

test("leftover uncovered leftover-only capacity Markdown is organizer-private leftover-fill offer capacity", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === coverage.secondary.offerId);
  assert.ok(coverage.leftoverBuyerCount > 0);
  assert.notEqual(leftoverOffer.capacity, leftoverOffer.unitPrice);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered leftover-only capacity \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOffer.capacity}\\.`));
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only allocated \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only unit price \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered maximum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered minimum \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMaximumMarkdown(scenario));
});

test("leftover uncovered leftover-only capacity Markdown is honest when leftover after the winner is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(scenario);
  assert.match(markdown, /leftover uncovered leftover-only capacity \(organizer private\): none\. Not a merchant export\./);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only allocated \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
});

test("triathlon carnival leftover uncovered leftover-only capacity stays distinct from leftover-only allocated, leftover-only remaining, leftover-only headroom, leftover unit price, and leftover minimum", () => {
  const triathlon = clonePreset("triathlonCarnivalLunch");
  const leftoverOnlyCapacity = createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(triathlon);
  const leftoverOnlyAllocated = createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(triathlon);
  const leftoverOnlyHeadroom = createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(triathlon);
  const leftoverOnlyMinimum = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(triathlon);
  const leftoverOnlyMaximum = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(triathlon);
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(triathlon);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(triathlon);
  const leftoverOffer = triathlon.offers.find((offer) => offer.id === computeResidualCoverage(triathlon).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 23);
  assert.equal(leftoverOffer.unitPrice, 18);
  assert.equal(leftoverOffer.capacity, 46);
  assert.match(leftoverOnlyCapacity, /leftover uncovered leftover-only capacity \(organizer private\): 46\./);
  assert.match(leftoverOnlyAllocated, /leftover uncovered leftover-only allocated \(organizer private\): 24\./);
  assert.match(leftoverOnlyHeadroom, /leftover uncovered leftover-only headroom \(organizer private\): 22\./);
  assert.match(leftoverOnlyRemaining, /leftover uncovered leftover-only remaining \(organizer private\): 24\./);
  assert.notEqual(46, leftoverOffer.unitPrice);
  assert.notEqual(46, leftoverOffer.minimumUnits);
  assert.notEqual(46, 24);
  assert.notEqual(46, 22);
  assert.notEqual(24, leftoverOffer.unitPrice);
  assert.notEqual(24, leftoverOffer.minimumUnits);
  assert.notEqual(24, 22);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyAllocated);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyHeadroom);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyRemaining);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyMinimum);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyMaximum);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyCount);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyHeadroom);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyRemaining);
  const surf = clonePreset("surfCarnivalLunch");
  const surfOffer = surf.offers.find((offer) => offer.id === computeResidualCoverage(surf).secondary.offerId);
  assert.equal(surfOffer.minimumUnits, 22);
  assert.equal(surfOffer.unitPrice, 17);
  assert.equal(surfOffer.capacity, 44);
  assert.match(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(surf), /leftover uncovered leftover-only allocated \(organizer private\): 23\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(surf), /leftover uncovered leftover-only headroom \(organizer private\): 21\./);
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(surf), createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(surf));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(surf), createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(surf));
});

test("the buyer room copies leftover uncovered leftover-only capacity with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-capacity"/u);
  assert.match(buyerPanel, /Copy leftover uncovered leftover-only capacity \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only capacity copy is leftover-fill offer capacity/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-capacity"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only capacity"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only capacity copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-allocated"/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyCapacityMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyCapacity\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyCapacity\(\);/u);
  assert.doesNotMatch(html, /id="copy-leftover-uncovered-leftover-only-capacity"[^>]*aria-keyshortcuts="Shift\+F7"/u);
});

test("leftover uncovered leftover-only unit price Markdown is organizer-private leftover-fill offer unit price", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(scenario);
  const coverage = computeResidualCoverage(scenario);
  const leftoverOffer = scenario.offers.find((offer) => offer.id === coverage.secondary.offerId);
  assert.ok(coverage.leftoverBuyerCount > 0);
  assert.notEqual(leftoverOffer.unitPrice, leftoverOffer.capacity);
  assert.notEqual(leftoverOffer.unitPrice, leftoverOffer.minimumUnits);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /leftover uncovered leftover-only unit price \(organizer private\)/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${leftoverOffer.unitPrice}\\.`));
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only capacity \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only allocated \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered maximum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered minimum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover unit price \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only allocated units/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredMinimumMarkdown(scenario));
  assert.notEqual(markdown, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillRemainingCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverFillMaximumMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverHeadroomMarkdown(scenario));
});

test("leftover uncovered leftover-only unit price Markdown is honest when leftover after the winner is missing", () => {
  const scenario = leftoverFixture();
  scenario.buyers.forEach((buyer) => {
    buyer.category = "Coffee beans";
    buyer.allowedVariants = ["Medium roast"];
    buyer.maxUnitPrice = 30;
    buyer.latestDeliveryDays = 10;
  });
  scenario.offers.forEach((offer) => { offer.minimumUnits = 1; offer.capacity = 5000; });
  const coverage = computeResidualCoverage(scenario);
  assert.equal(coverage.leftoverBuyerCount, 0);
  const markdown = createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(scenario);
  assert.match(markdown, /leftover uncovered leftover-only unit price \(organizer private\): none\. Not a merchant export\./);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only capacity \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only allocated \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(markdown, /leftover unit price \(organizer private\)/);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("Leaf Collective"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(scenario));
  assert.notEqual(markdown, createLeftoverUncoveredLeftoverOnlyCountMarkdown(scenario));
});

test("cycling carnival leftover uncovered leftover-only unit price stays distinct from leftover-only capacity, leftover-only allocated, leftover-only remaining, leftover-only headroom, leftover unit price, and leftover minimum", () => {
  const cycling = clonePreset("cyclingCarnivalLunch");
  const leftoverOnlyUnitPrice = createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(cycling);
  const leftoverOnlyCapacity = createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(cycling);
  const leftoverOnlyAllocated = createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(cycling);
  const leftoverOnlyHeadroom = createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(cycling);
  const leftoverOnlyMinimum = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(cycling);
  const leftoverOnlyMaximum = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(cycling);
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(cycling);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(cycling);
  const leftoverOffer = cycling.offers.find((offer) => offer.id === computeResidualCoverage(cycling).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 24);
  assert.equal(leftoverOffer.unitPrice, 19);
  assert.equal(leftoverOffer.capacity, 48);
  assert.match(leftoverOnlyUnitPrice, /leftover uncovered leftover-only unit price \(organizer private\): 19\./);
  assert.match(leftoverOnlyCapacity, /leftover uncovered leftover-only capacity \(organizer private\): 48\./);
  assert.match(leftoverOnlyAllocated, /leftover uncovered leftover-only allocated \(organizer private\): 25\./);
  assert.match(leftoverOnlyHeadroom, /leftover uncovered leftover-only headroom \(organizer private\): 23\./);
  assert.match(leftoverOnlyRemaining, /leftover uncovered leftover-only remaining \(organizer private\): 25\./);
  assert.notEqual(19, leftoverOffer.capacity);
  assert.notEqual(19, leftoverOffer.minimumUnits);
  assert.notEqual(19, 25);
  assert.notEqual(19, 23);
  assert.notEqual(48, leftoverOffer.unitPrice);
  assert.notEqual(48, leftoverOffer.minimumUnits);
  assert.notEqual(48, 25);
  assert.notEqual(48, 23);
  assert.notEqual(25, leftoverOffer.unitPrice);
  assert.notEqual(25, leftoverOffer.minimumUnits);
  assert.notEqual(25, 23);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyCapacity);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyAllocated);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyHeadroom);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyRemaining);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyMinimum);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyMaximum);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyCount);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyAllocated);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyHeadroom);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyRemaining);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyHeadroom);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyRemaining);
  const triathlon = clonePreset("triathlonCarnivalLunch");
  const triathlonOffer = triathlon.offers.find((offer) => offer.id === computeResidualCoverage(triathlon).secondary.offerId);
  assert.equal(triathlonOffer.minimumUnits, 23);
  assert.equal(triathlonOffer.unitPrice, 18);
  assert.equal(triathlonOffer.capacity, 46);
  assert.match(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(triathlon), /leftover uncovered leftover-only capacity \(organizer private\): 46\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(triathlon), /leftover uncovered leftover-only allocated \(organizer private\): 24\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(triathlon), /leftover uncovered leftover-only headroom \(organizer private\): 22\./);
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(triathlon), createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(triathlon));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(triathlon), createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(triathlon));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(triathlon), createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(triathlon));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(triathlon), createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(triathlon));
});

test("mountain bike carnival leftover uncovered leftover-only minimum stays distinct from leftover-only unit price, leftover-only capacity, leftover-only allocated, leftover-only remaining, leftover-only headroom, leftover unit price, and leftover fill minimum", () => {
  const mountainBike = clonePreset("mountainBikeCarnivalLunch");
  const leftoverOnlyUnitPrice = createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(mountainBike);
  const leftoverOnlyCapacity = createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(mountainBike);
  const leftoverOnlyAllocated = createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(mountainBike);
  const leftoverOnlyHeadroom = createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(mountainBike);
  const leftoverOnlyMinimum = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(mountainBike);
  const leftoverOnlyMaximum = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(mountainBike);
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(mountainBike);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(mountainBike);
  const leftoverOffer = mountainBike.offers.find((offer) => offer.id === computeResidualCoverage(mountainBike).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 25);
  assert.equal(leftoverOffer.unitPrice, 20);
  assert.equal(leftoverOffer.capacity, 50);
  assert.match(leftoverOnlyMinimum, /leftover uncovered leftover-only minimum \(organizer private\): 11\./);
  assert.match(leftoverOnlyUnitPrice, /leftover uncovered leftover-only unit price \(organizer private\): 20\./);
  assert.match(leftoverOnlyCapacity, /leftover uncovered leftover-only capacity \(organizer private\): 50\./);
  assert.match(leftoverOnlyAllocated, /leftover uncovered leftover-only allocated \(organizer private\): 26\./);
  assert.match(leftoverOnlyHeadroom, /leftover uncovered leftover-only headroom \(organizer private\): 24\./);
  assert.match(leftoverOnlyRemaining, /leftover uncovered leftover-only remaining \(organizer private\): 26\./);
  assert.notEqual(11, leftoverOffer.minimumUnits);
  assert.notEqual(11, leftoverOffer.unitPrice);
  assert.notEqual(11, leftoverOffer.capacity);
  assert.notEqual(11, 26);
  assert.notEqual(11, 24);
  assert.notEqual(20, leftoverOffer.minimumUnits);
  assert.notEqual(20, leftoverOffer.capacity);
  assert.notEqual(20, 26);
  assert.notEqual(20, 24);
  assert.notEqual(50, leftoverOffer.unitPrice);
  assert.notEqual(50, leftoverOffer.minimumUnits);
  assert.notEqual(50, 26);
  assert.notEqual(50, 24);
  assert.notEqual(leftoverOnlyMinimum, leftoverOnlyUnitPrice);
  assert.notEqual(leftoverOnlyMinimum, leftoverOnlyCapacity);
  assert.notEqual(leftoverOnlyMinimum, leftoverOnlyAllocated);
  assert.notEqual(leftoverOnlyMinimum, leftoverOnlyHeadroom);
  assert.notEqual(leftoverOnlyMinimum, leftoverOnlyRemaining);
  assert.notEqual(leftoverOnlyMinimum, leftoverOnlyMaximum);
  assert.notEqual(leftoverOnlyMinimum, leftoverOnlyCount);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyCapacity);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyAllocated);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyAllocated);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyHeadroom);
  const cycling = clonePreset("cyclingCarnivalLunch");
  const cyclingOffer = cycling.offers.find((offer) => offer.id === computeResidualCoverage(cycling).secondary.offerId);
  assert.equal(cyclingOffer.minimumUnits, 24);
  assert.equal(cyclingOffer.unitPrice, 19);
  assert.equal(cyclingOffer.capacity, 48);
  assert.match(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(cycling), /leftover uncovered leftover-only minimum \(organizer private\): 10\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(cycling), /leftover uncovered leftover-only capacity \(organizer private\): 48\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(cycling), /leftover uncovered leftover-only allocated \(organizer private\): 25\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(cycling), /leftover uncovered leftover-only headroom \(organizer private\): 23\./);
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(mountainBike), createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(cycling));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(mountainBike), createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(cycling));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(mountainBike), createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(cycling));
});

test("bmx carnival leftover uncovered leftover-only headroom stays distinct from leftover-only unit price, leftover-only capacity, leftover-only allocated, leftover-only remaining, leftover-only minimum, leftover unit price, and leftover fill minimum", () => {
  const bmx = clonePreset("bmxCarnivalLunch");
  const leftoverOnlyUnitPrice = createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(bmx);
  const leftoverOnlyCapacity = createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(bmx);
  const leftoverOnlyAllocated = createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(bmx);
  const leftoverOnlyHeadroom = createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(bmx);
  const leftoverOnlyMinimum = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(bmx);
  const leftoverOnlyMaximum = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(bmx);
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(bmx);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(bmx);
  const leftoverOffer = bmx.offers.find((offer) => offer.id === computeResidualCoverage(bmx).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 26);
  assert.equal(leftoverOffer.unitPrice, 21);
  assert.equal(leftoverOffer.capacity, 52);
  assert.match(leftoverOnlyHeadroom, /leftover uncovered leftover-only headroom \(organizer private\): 25\./);
  assert.match(leftoverOnlyMinimum, /leftover uncovered leftover-only minimum \(organizer private\): 12\./);
  assert.match(leftoverOnlyUnitPrice, /leftover uncovered leftover-only unit price \(organizer private\): 21\./);
  assert.match(leftoverOnlyCapacity, /leftover uncovered leftover-only capacity \(organizer private\): 52\./);
  assert.match(leftoverOnlyAllocated, /leftover uncovered leftover-only allocated \(organizer private\): 27\./);
  assert.match(leftoverOnlyRemaining, /leftover uncovered leftover-only remaining \(organizer private\): 27\./);
  assert.notEqual(25, leftoverOffer.minimumUnits);
  assert.notEqual(25, leftoverOffer.unitPrice);
  assert.notEqual(25, leftoverOffer.capacity);
  assert.notEqual(25, 27);
  assert.notEqual(25, 12);
  assert.notEqual(21, leftoverOffer.minimumUnits);
  assert.notEqual(21, leftoverOffer.capacity);
  assert.notEqual(21, 27);
  assert.notEqual(21, 12);
  assert.notEqual(52, leftoverOffer.unitPrice);
  assert.notEqual(52, leftoverOffer.minimumUnits);
  assert.notEqual(52, 27);
  assert.notEqual(52, 12);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyUnitPrice);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyCapacity);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyAllocated);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyMinimum);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyRemaining);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyMaximum);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyCount);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyCapacity);
  assert.notEqual(leftoverOnlyUnitPrice, leftoverOnlyAllocated);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyAllocated);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyHeadroom);
  const mountainBike = clonePreset("mountainBikeCarnivalLunch");
  const mountainBikeOffer = mountainBike.offers.find((offer) => offer.id === computeResidualCoverage(mountainBike).secondary.offerId);
  assert.equal(mountainBikeOffer.minimumUnits, 25);
  assert.equal(mountainBikeOffer.unitPrice, 20);
  assert.equal(mountainBikeOffer.capacity, 50);
  assert.match(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(mountainBike), /leftover uncovered leftover-only headroom \(organizer private\): 24\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(mountainBike), /leftover uncovered leftover-only minimum \(organizer private\): 11\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(mountainBike), /leftover uncovered leftover-only capacity \(organizer private\): 50\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(mountainBike), /leftover uncovered leftover-only allocated \(organizer private\): 26\./);
  const cycling = clonePreset("cyclingCarnivalLunch");
  const cyclingOffer = cycling.offers.find((offer) => offer.id === computeResidualCoverage(cycling).secondary.offerId);
  assert.equal(cyclingOffer.minimumUnits, 24);
  assert.equal(cyclingOffer.unitPrice, 19);
  assert.equal(cyclingOffer.capacity, 48);
  assert.match(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(cycling), /leftover uncovered leftover-only headroom \(organizer private\): 23\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(cycling), /leftover uncovered leftover-only minimum \(organizer private\): 10\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(cycling), /leftover uncovered leftover-only allocated \(organizer private\): 25\./);
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(bmx), createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(mountainBike));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(bmx), createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(cycling));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(bmx), createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(mountainBike));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(bmx), createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(cycling));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(bmx), createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(mountainBike));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(bmx), createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(cycling));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(bmx), createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(mountainBike));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(bmx), createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(mountainBike));
});

test("cyclo-cross carnival leftover uncovered leftover-only allocated stays distinct from leftover-only unit price, leftover-only capacity, leftover-only remaining, leftover-only headroom, leftover-only minimum, leftover unit price, and leftover fill remaining", () => {
  const cycloCross = clonePreset("cycloCrossCarnivalLunch");
  const leftoverOnlyUnitPrice = createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(cycloCross);
  const leftoverOnlyCapacity = createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(cycloCross);
  const leftoverOnlyAllocated = createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(cycloCross);
  const leftoverOnlyHeadroom = createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(cycloCross);
  const leftoverOnlyMinimum = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(cycloCross);
  const leftoverOnlyMaximum = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(cycloCross);
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(cycloCross);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(cycloCross);
  const leftoverOffer = cycloCross.offers.find((offer) => offer.id === computeResidualCoverage(cycloCross).secondary.offerId);
  assert.equal(leftoverOffer.minimumUnits, 27);
  assert.equal(leftoverOffer.unitPrice, 22);
  assert.equal(leftoverOffer.capacity, 54);
  assert.match(leftoverOnlyAllocated, /leftover uncovered leftover-only allocated \(organizer private\): 28\./);
  assert.match(leftoverOnlyHeadroom, /leftover uncovered leftover-only headroom \(organizer private\): 26\./);
  assert.match(leftoverOnlyMinimum, /leftover uncovered leftover-only minimum \(organizer private\): 13\./);
  assert.match(leftoverOnlyUnitPrice, /leftover uncovered leftover-only unit price \(organizer private\): 22\./);
  assert.match(leftoverOnlyCapacity, /leftover uncovered leftover-only capacity \(organizer private\): 54\./);
  assert.match(leftoverOnlyRemaining, /leftover uncovered leftover-only remaining \(organizer private\): 28\./);
  assert.notEqual(28, leftoverOffer.minimumUnits);
  assert.notEqual(28, leftoverOffer.unitPrice);
  assert.notEqual(28, leftoverOffer.capacity);
  assert.notEqual(28, 26);
  assert.notEqual(28, 13);
  assert.notEqual(22, leftoverOffer.minimumUnits);
  assert.notEqual(22, leftoverOffer.capacity);
  assert.notEqual(22, 26);
  assert.notEqual(22, 13);
  assert.notEqual(54, leftoverOffer.unitPrice);
  assert.notEqual(54, leftoverOffer.minimumUnits);
  assert.notEqual(54, 28);
  assert.notEqual(54, 26);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyUnitPrice);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyCapacity);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyHeadroom);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyMinimum);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyRemaining);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyMaximum);
  assert.notEqual(leftoverOnlyAllocated, leftoverOnlyCount);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyUnitPrice);
  assert.notEqual(leftoverOnlyHeadroom, leftoverOnlyCapacity);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyAllocated);
  assert.notEqual(leftoverOnlyCapacity, leftoverOnlyHeadroom);
  const bmx = clonePreset("bmxCarnivalLunch");
  const bmxOffer = bmx.offers.find((offer) => offer.id === computeResidualCoverage(bmx).secondary.offerId);
  assert.equal(bmxOffer.minimumUnits, 26);
  assert.equal(bmxOffer.unitPrice, 21);
  assert.equal(bmxOffer.capacity, 52);
  assert.match(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(bmx), /leftover uncovered leftover-only allocated \(organizer private\): 27\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(bmx), /leftover uncovered leftover-only headroom \(organizer private\): 25\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(bmx), /leftover uncovered leftover-only minimum \(organizer private\): 12\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(bmx), /leftover uncovered leftover-only capacity \(organizer private\): 52\./);
  const mountainBike = clonePreset("mountainBikeCarnivalLunch");
  const mountainBikeOffer = mountainBike.offers.find((offer) => offer.id === computeResidualCoverage(mountainBike).secondary.offerId);
  assert.equal(mountainBikeOffer.minimumUnits, 25);
  assert.equal(mountainBikeOffer.unitPrice, 20);
  assert.equal(mountainBikeOffer.capacity, 50);
  assert.match(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(mountainBike), /leftover uncovered leftover-only allocated \(organizer private\): 26\./);
  assert.match(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(mountainBike), /leftover uncovered leftover-only headroom \(organizer private\): 24\./);
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(cycloCross), createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(bmx));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(cycloCross), createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(mountainBike));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(cycloCross), createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(bmx));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(cycloCross), createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(mountainBike));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(cycloCross), createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(bmx));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(cycloCross), createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(bmx));
  assert.notEqual(createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(cycloCross), createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(bmx));
});

test("the buyer room copies leftover uncovered leftover-only unit price with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-unit-price"/u);
  assert.match(buyerPanel, /Copy leftover uncovered leftover-only unit price \(organizer private\)/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only unit price copy is leftover-fill offer unit price/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-unit-price"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only unit price"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only unit price copy"), false);
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-capacity"/u);
  assert.match(app, /createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown\(/u);
  assert.match(app, /function copyLeftoverUncoveredLeftoverOnlyUnitPrice\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.match(app, /Count only\. This is not a merchant export/u);
  assert.doesNotMatch(app, /if \(event\.shiftKey && key === "F7"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverUncoveredLeftoverOnlyUnitPrice\(\);/u);
  assert.doesNotMatch(html, /id="copy-leftover-uncovered-leftover-only-unit-price"[^>]*aria-keyshortcuts="Shift\+F7"/u);
  assert.match(html, /id="copy-leftover-uncovered-leftover-only-allocated"[^>]*aria-keyshortcuts="Shift\+F7"/u);
});

test("winning remaining capacity Markdown is remaining units only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createWinningRemainingCapacityMarkdown(scenario);
  const market = evaluateMarket(scenario);
  const remaining = market.winner.offer.capacity - market.winner.fulfilledUnits;
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /^Winning remaining capacity: \d+ units$/m);
  assert.match(markdown, new RegExp(`Winning remaining capacity: ${remaining} units`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("winning remaining capacity Markdown is honest when none unlocked", () => {
  const scenario = leftoverFixture();
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const markdown = createWinningRemainingCapacityMarkdown(scenario);
  assert.match(markdown, /^Winning remaining capacity: None unlocked$/m);
  assert.equal(markdown.includes("Harbour Roasters"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("units"), false);
});

test("winning remaining capacity copy sits next to leftover print and stays off the merchant table", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const leftover = html.slice(html.indexOf('id="leftover-print-winner"'), html.indexOf('id="copy-leftover-coverage"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(leftover, /id="copy-winning-remaining-capacity"/u);
  assert.match(leftover, /Copy remaining capacity/u);
  assert.match(leftover, /Honest empty when none unlocked/u);
  assert.equal(merchantPanel.includes("copy-winning-remaining-capacity"), false);
  assert.match(app, /createWinningRemainingCapacityMarkdown\(/u);
  assert.match(app, /function copyWinningRemainingCapacity\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /if \(key === ","\)/u);
  assert.doesNotMatch(app, /if \(key === "y"\) \{\s*event\.preventDefault\(\);\s*copyWinningRemainingCapacity/u);
  assert.doesNotMatch(app, /if \(key === "z"\) \{\s*event\.preventDefault\(\);\s*copyWinningRemainingCapacity/u);
});

test("requested units Markdown is organizer-private count only", () => {
  const scenario = leftoverFixture();
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createRequestedUnitsMarkdown(scenario);
  const market = evaluateMarket(scenario);
  assert.equal(markdown.trim().includes("\n"), false);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /Not a merchant export/);
  assert.match(markdown, new RegExp(`: ${market.totalRequestedUnits}\\.`));
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes("Tea room"), false);
  assert.equal(markdown.includes("Harbour Roasters"), false);
});

test("the buyer room copies requested units with a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-requested-units"/u);
  assert.match(buyerPanel, /Copy requested units \(organizer private\)/u);
  assert.match(buyerPanel, /Organizer-private one-line Markdown of requested units/u);
  assert.equal(merchantPanel.includes("copy-requested-units"), false);
  assert.match(app, /createRequestedUnitsMarkdown\(/u);
  assert.match(app, /function copyRequestedUnits\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.match(app, /This is not a merchant export/u);
  assert.doesNotMatch(app, /if \(key === "q"\) \{\s*event\.preventDefault\(\);\s*copyRequestedUnits/u);
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
