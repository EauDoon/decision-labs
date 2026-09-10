import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clonePreset,
  evaluateMarket,
  redactBuyerLabels,
  validateScenario,
  encodeScenario,
  encodeRedactedScenario,
  decodeScenario,
  createOfferIdentityCompareMarkdown,
  compareRoomsByOfferIdentity,
  createVariantOverlapMarkdown,
  createVariantOverlapCsv,
  createExclusionCountsMarkdown,
  createMerchantReport,
  createMerchantResidualReport,
  createOrganizerBriefing,
  createWinnerAggregatesMarkdown,
  createDeliveryHeatmapCsv,
  createOfferCsv,
  createOrganizerBuyerCsv,
  createCartReviewPacket,
  analyzeCartReview,
  leftoverCoverageRows,
  createLeftoverCoverageMarkdown,
  createWinnerInspectorSummaryMarkdown,
  createUncoveredLeftoverCountsMarkdown,
  createWinningMerchantLabelMarkdown,
  createLeftoverHeadroomMarkdown,
  createWinningFulfillmentMarkdown,
  createLeftoverFillMarkdown,
  createLeftoverFillUnitCountMarkdown,
  createLeftoverFillMerchantLabelMarkdown,
  createWinningRemainingCapacityMarkdown,
  createRequestedUnitsMarkdown,
  createUncoveredLeftoverUnitCountMarkdown
} from "../src/model.js";

const PRIVATE_BUYER_MARKERS = ["SECRET_LABEL", "SECRET_ID", "SECRET_STUDIO", "987654.32", "maxUnitPrice", "leftoverBuyerIds", '"selectedBuyerIds":', '"allocations":'];

function secretNeighbourhood() {
  const scenario = clonePreset("neighbourhood");
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  return scenario;
}

function assertOmitsPrivateBuyers(text, extra = []) {
  for (const marker of [...PRIVATE_BUYER_MARKERS, ...extra]) {
    assert.equal(String(text).includes(marker), false, marker);
  }
}

test("redactBuyerLabels replaces private labels without changing ids or the source room", () => {
  const source = clonePreset("neighbourhood");
  source.buyers[0].label = "SECRET_HALL";
  const before = JSON.stringify(source);
  const redacted = redactBuyerLabels(source);
  assert.equal(JSON.stringify(source), before);
  assert.equal(redacted.buyers[0].label, "Buyer 1");
  assert.equal(redacted.buyers[1].label, "Buyer 2");
  assert.equal(redacted.buyers.at(-1).label, `Buyer ${redacted.buyers.length}`);
  assert.equal(redacted.buyers[0].id, source.buyers[0].id);
  assert.equal(redacted.buyers[0].quantity, source.buyers[0].quantity);
  assert.equal(JSON.stringify(redacted).includes("SECRET_HALL"), false);
  assert.deepEqual(evaluateMarket(redacted).winner?.selectedBuyerIds, evaluateMarket(source).winner?.selectedBuyerIds);
  assert.deepEqual(validateScenario(redacted).buyers.map((buyer) => buyer.label), redacted.buyers.map((buyer) => buyer.label));
});

test("redacted export keeps offer text and omits original buyer labels", () => {
  const source = clonePreset("studio");
  const labels = source.buyers.map((buyer) => buyer.label);
  const redacted = redactBuyerLabels(source);
  const json = JSON.stringify(redacted);
  for (const label of labels) assert.equal(json.includes(label), false);
  assert.equal(redacted.offers[0].merchant, source.offers[0].merchant);
  redacted.buyers[0].label = "Mutated";
  assert.equal(redactBuyerLabels(source).buyers[0].label, "Buyer 1");
});

test("redacted share encoding uses Buyer 1 through N and leaves the default share payload unchanged", () => {
  const source = clonePreset("neighbourhood");
  source.buyers[0].label = "SECRET_HALL";
  const defaultShare = encodeScenario(source);
  const redactedShare = encodeRedactedScenario(source);
  assert.notEqual(defaultShare, redactedShare);
  const restored = decodeScenario(defaultShare);
  const redacted = decodeScenario(redactedShare);
  assert.equal(restored.buyers[0].label, "SECRET_HALL");
  assert.equal(redacted.buyers[0].label, "Buyer 1");
  assert.equal(redacted.buyers[1].label, "Buyer 2");
  assert.equal(redacted.buyers.at(-1).label, `Buyer ${redacted.buyers.length}`);
  assert.equal(redacted.buyers[0].id, source.buyers[0].id);
  assert.equal(JSON.stringify(redacted).includes("SECRET_HALL"), false);
  assert.equal(source.buyers[0].label, "SECRET_HALL");
  assert.deepEqual(evaluateMarket(redacted).winner?.selectedBuyerIds, evaluateMarket(source).winner?.selectedBuyerIds);
});

test("offer identity compare markdown omits buyer labels, ids, budgets, and allocations", () => {
  const left = clonePreset("neighbourhood");
  const right = clonePreset("studio");
  left.title = "SECRET_TITLE";
  left.buyers[0].label = "SECRET_LABEL";
  left.buyers[0].id = "SECRET_ID";
  left.buyers[0].maxOrderTotal = 987654.32;
  right.buyers[0].label = "SECRET_STUDIO";
  const markdown = createOfferIdentityCompareMarkdown(left, right);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("SECRET_STUDIO"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes('"selectedBuyerIds":'), false);
  assert.equal(markdown.includes('"allocations":'), false);
  assert.match(markdown, /omit private buyer labels, IDs, budgets, and allocations/);
});

test("variant overlap Markdown omits buyer labels, ids, budgets, and allocations", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createVariantOverlapMarkdown(scenario);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes('"selectedBuyerIds":'), false);
  assert.equal(markdown.includes('"allocations":'), false);
  assert.match(markdown, /Labels, IDs, budgets, and allocations are omitted/);
  assert.doesNotMatch(markdown, /North block|Garden row|Library crew|Station flats|West court/u);
});

test("exclusion counts markdown omits buyer labels, ids, budgets, and allocations", () => {
  const scenario = secretNeighbourhood();
  const markdown = createExclusionCountsMarkdown(scenario, scenario.offers[1].id);
  assertOmitsPrivateBuyers(markdown, ["SECRET_TITLE"]);
  assert.match(markdown, /omit private buyer labels, IDs, budgets, and allocations/);
});

test("winner inspector summary Markdown omits buyer labels, ids, budgets, and allocations", () => {
  const scenario = secretNeighbourhood();
  const markdown = createWinnerInspectorSummaryMarkdown(scenario);
  assertOmitsPrivateBuyers(markdown, ["SECRET_TITLE"]);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /not a merchant export/);
});

test("leftover coverage Markdown omits buyer labels, ids, budgets, and allocations", () => {
  const scenario = secretNeighbourhood();
  const markdown = createLeftoverCoverageMarkdown(scenario);
  assertOmitsPrivateBuyers(markdown, ["SECRET_TITLE"]);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /not a merchant export/);
  const json = JSON.stringify(leftoverCoverageRows(scenario));
  assertOmitsPrivateBuyers(json, ["SECRET_TITLE"]);
});

test("uncovered leftover and winning merchant Markdown omit buyer identities", () => {
  const scenario = secretNeighbourhood();
  const uncovered = createUncoveredLeftoverCountsMarkdown(scenario);
  const merchant = createWinningMerchantLabelMarkdown(scenario);
  assertOmitsPrivateBuyers(uncovered, ["SECRET_TITLE"]);
  assertOmitsPrivateBuyers(merchant, ["SECRET_TITLE"]);
  assert.match(uncovered, /organizer private/);
  assert.match(uncovered, /not a merchant export/);
  assert.match(merchant, /Merchant label only/);
  assert.match(merchant, /Harbour Roasters|None unlocked/);
});

test("leftover unspent item headroom Markdown omits buyer identities", () => {
  const scenario = secretNeighbourhood();
  const leftover = createLeftoverHeadroomMarkdown(scenario);
  assertOmitsPrivateBuyers(leftover, ["SECRET_TITLE"]);
  assert.match(leftover, /organizer private/);
  assert.match(leftover, /Not a rebate/);
  assert.equal(leftover.includes("Harbour Roasters"), false);
});

test("winning remaining capacity Markdown omits buyer identities", () => {
  const scenario = secretNeighbourhood();
  const remaining = createWinningRemainingCapacityMarkdown(scenario);
  assertOmitsPrivateBuyers(remaining, ["SECRET_TITLE"]);
  assert.match(remaining, /Winning remaining capacity: (\d+ units|None unlocked)/);
  assert.equal(remaining.includes("Harbour Roasters"), false);
});

test("requested units Markdown omits buyer identities", () => {
  const scenario = secretNeighbourhood();
  const requested = createRequestedUnitsMarkdown(scenario);
  assertOmitsPrivateBuyers(requested, ["SECRET_TITLE"]);
  assert.match(requested, /organizer private/);
  assert.match(requested, /Not a merchant export/);
  assert.match(requested, /requested units/);
  assert.equal(requested.includes("Harbour Roasters"), false);
});

test("winning fulfillment Markdown omits buyer identities", () => {
  const scenario = secretNeighbourhood();
  const fulfillment = createWinningFulfillmentMarkdown(scenario);
  assertOmitsPrivateBuyers(fulfillment, ["SECRET_TITLE"]);
  assert.match(fulfillment, /Winning fulfillment: (pickup|shipping|None unlocked)/);
  assert.equal(fulfillment.includes("Harbour Roasters"), false);
});

test("leftover fill Markdown omits buyer identities", () => {
  const scenario = secretNeighbourhood();
  const leftoverFill = createLeftoverFillMarkdown(scenario);
  assertOmitsPrivateBuyers(leftoverFill, ["SECRET_TITLE"]);
  assert.match(leftoverFill, /organizer private/);
  assert.match(leftoverFill, /Not a merchant export/);
});

test("leftover fill unit-count Markdown omits buyer identities", () => {
  const scenario = secretNeighbourhood();
  const leftoverFillUnits = createLeftoverFillUnitCountMarkdown(scenario);
  assertOmitsPrivateBuyers(leftoverFillUnits, ["SECRET_TITLE"]);
  assert.match(leftoverFillUnits, /organizer private/);
  assert.match(leftoverFillUnits, /Not a merchant export/);
  assert.equal(leftoverFillUnits.includes("Harbour Roasters"), false);
});

test("leftover fill merchant Markdown omits buyer identities", () => {
  const scenario = secretNeighbourhood();
  const leftoverFillMerchant = createLeftoverFillMerchantLabelMarkdown(scenario);
  assertOmitsPrivateBuyers(leftoverFillMerchant, ["SECRET_TITLE"]);
  assert.match(leftoverFillMerchant, /organizer private/);
  assert.match(leftoverFillMerchant, /Not a merchant export/);
  assert.notEqual(leftoverFillMerchant, createLeftoverFillMarkdown(scenario));
  assert.notEqual(leftoverFillMerchant, createLeftoverFillUnitCountMarkdown(scenario));
  assert.notEqual(leftoverFillMerchant, createUncoveredLeftoverUnitCountMarkdown(scenario));
  assert.notEqual(leftoverFillMerchant, createWinningMerchantLabelMarkdown(scenario));
});

test("merchant surfaces omit leftover fill unit-count copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-units"/u);
  assert.match(buyerPanel, /Leftover fill unit-count copy is count only/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-units"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill units"), false);
  assert.equal(merchantPanel.includes("Leftover fill unit-count copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverFillUnitCountMarkdown"), false);
  const leftoverFillUnits = createLeftoverFillUnitCountMarkdown(secretNeighbourhood());
  assert.match(leftoverFillUnits, /organizer private/);
  assert.match(leftoverFillUnits, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverFillUnits, ["SECRET_TITLE"]);
  const left = secretNeighbourhood();
  const merchantSurfaces = [
    JSON.stringify(createMerchantReport(left)),
    JSON.stringify(createMerchantResidualReport(left)),
    createWinnerAggregatesMarkdown(left),
    createDeliveryHeatmapCsv(left),
    createOfferCsv(left),
    createVariantOverlapCsv(left),
    createVariantOverlapMarkdown(left),
    createExclusionCountsMarkdown(left, left.offers[1].id),
    createWinningMerchantLabelMarkdown(left),
    createWinningFulfillmentMarkdown(left),
    createWinningRemainingCapacityMarkdown(left)
  ];
  for (const text of merchantSurfaces) {
    assert.equal(String(text).includes("leftover fill units (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-fill-units"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit uncovered leftover unit-count copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-uncovered-leftover-units"/u);
  assert.match(buyerPanel, /Uncovered leftover unit-count copy is count only/u);
  assert.equal(merchantPanel.includes("copy-uncovered-leftover-units"), false);
  assert.equal(merchantPanel.includes("Copy uncovered leftover units"), false);
  assert.equal(merchantPanel.includes("Uncovered leftover unit-count copy"), false);
  assert.equal(merchantPanel.includes("createUncoveredLeftoverUnitCountMarkdown"), false);
  const uncoveredUnits = createUncoveredLeftoverUnitCountMarkdown(secretNeighbourhood());
  assert.match(uncoveredUnits, /organizer private/);
  assert.match(uncoveredUnits, /Not a merchant export/);
  assertOmitsPrivateBuyers(uncoveredUnits, ["SECRET_TITLE"]);
  const left = secretNeighbourhood();
  const merchantSurfaces = [
    JSON.stringify(createMerchantReport(left)),
    JSON.stringify(createMerchantResidualReport(left)),
    createWinnerAggregatesMarkdown(left),
    createDeliveryHeatmapCsv(left),
    createOfferCsv(left),
    createVariantOverlapCsv(left),
    createVariantOverlapMarkdown(left),
    createExclusionCountsMarkdown(left, left.offers[1].id),
    createWinningMerchantLabelMarkdown(left),
    createWinningFulfillmentMarkdown(left),
    createWinningRemainingCapacityMarkdown(left)
  ];
  for (const text of merchantSurfaces) {
    assert.equal(String(text).includes("uncovered leftover units (organizer private)"), false);
    assert.equal(String(text).includes("copy-uncovered-leftover-units"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover fill merchant copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-merchant"/u);
  assert.match(buyerPanel, /Leftover fill merchant copy is merchant label only/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-merchant"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill merchant"), false);
  assert.equal(merchantPanel.includes("Leftover fill merchant copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverFillMerchantLabelMarkdown"), false);
  const leftoverFillMerchant = createLeftoverFillMerchantLabelMarkdown(secretNeighbourhood());
  assert.match(leftoverFillMerchant, /organizer private/);
  assert.match(leftoverFillMerchant, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverFillMerchant, ["SECRET_TITLE"]);
  const left = secretNeighbourhood();
  const merchantSurfaces = [
    JSON.stringify(createMerchantReport(left)),
    JSON.stringify(createMerchantResidualReport(left)),
    createWinnerAggregatesMarkdown(left),
    createDeliveryHeatmapCsv(left),
    createOfferCsv(left),
    createVariantOverlapCsv(left),
    createVariantOverlapMarkdown(left),
    createExclusionCountsMarkdown(left, left.offers[1].id),
    createWinningMerchantLabelMarkdown(left),
    createWinningFulfillmentMarkdown(left),
    createWinningRemainingCapacityMarkdown(left)
  ];
  for (const text of merchantSurfaces) {
    assert.equal(String(text).includes("leftover fill merchant (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-fill-merchant"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("leftover print one-pager uses merchant labels and omits private buyer rows", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const leftover = html.slice(html.indexOf('id="leftover-print-winner"'), html.indexOf('id="copy-leftover-coverage"'));
  assert.match(leftover, /Winner merchant:/u);
  assert.match(leftover, /Merchant labels only/u);
  assert.match(leftover, /print-private/u);
  assert.match(leftover, /leftover-print-overlap/u);
  assert.match(leftover, /leftover-print-uncovered/u);
  assert.match(leftover, /Uncovered leftover: 0 buyers, 0 units/u);
  assert.match(leftover, /leftover-print-uncovered-units/u);
  assert.match(leftover, /Uncovered leftover units: none/u);
  assert.match(leftover, /leftover-print-requested/u);
  assert.match(leftover, /Requested units: 0/u);
  assert.match(leftover, /leftover-print-fill/u);
  assert.match(leftover, /Leftover fill merchant: None/u);
  assert.match(leftover, /leftover-print-fill-merchant/u);
  assert.match(leftover, /Leftover fill merchant label: None/u);
  assert.match(leftover, /leftover-print-fill-remaining/u);
  assert.match(leftover, /Leftover fill remaining capacity: none/u);
  assert.equal(leftover.includes("maxUnitPrice"), false);
  assert.match(css, /body\.print-leftover \.print-private/u);
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.equal(merchantPanel.includes("leftover-coverage-rows"), false);
  assert.equal(merchantPanel.includes("leftover-print-winner"), false);
  assert.equal(merchantPanel.includes("leftover-buyer-rows"), false);
  assert.equal(merchantPanel.includes("leftover-print-overlap"), false);
  assert.equal(merchantPanel.includes("leftover-print-uncovered"), false);
  assert.equal(merchantPanel.includes("leftover-print-uncovered-units"), false);
  assert.equal(merchantPanel.includes("leftover-print-requested"), false);
  assert.equal(merchantPanel.includes("leftover-print-fill"), false);
  assert.equal(merchantPanel.includes("leftover-print-fill-merchant"), false);
  assert.equal(merchantPanel.includes("leftover-print-fill-remaining"), false);
});

test("merchant-facing 1.4.1 surfaces omit buyer labels, ids, budgets, and allocations", () => {
  const left = secretNeighbourhood();
  const right = clonePreset("studio");
  right.title = "SECRET_STUDIO_TITLE";
  right.buyers[0].label = "SECRET_STUDIO";
  right.buyers[0].id = "SECRET_STUDIO_ID";
  right.buyers[0].maxOrderTotal = 987654.32;
  const merchantSurfaces = [
    JSON.stringify(createMerchantReport(left)),
    JSON.stringify(createMerchantResidualReport(left)),
    createWinnerAggregatesMarkdown(left),
    createDeliveryHeatmapCsv(left),
    createOfferCsv(left),
    createVariantOverlapCsv(left),
    createVariantOverlapMarkdown(left),
    createExclusionCountsMarkdown(left, left.offers[1].id),
    createOfferIdentityCompareMarkdown(left, right),
    JSON.stringify(compareRoomsByOfferIdentity(left, right)),
    createWinningMerchantLabelMarkdown(left),
    createWinningFulfillmentMarkdown(left),
    createWinningRemainingCapacityMarkdown(left)
  ];
  for (const text of merchantSurfaces) {
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE", "SECRET_STUDIO_TITLE", "SECRET_STUDIO_ID"]);
  }
  const briefing = createOrganizerBriefing(left);
  assert.match(briefing, /SECRET_TITLE/);
  assertOmitsPrivateBuyers(briefing);
});

test("organizer buyer CSV may include private rows and is labeled organizer-private", async () => {
  const scenario = secretNeighbourhood();
  const csv = createOrganizerBuyerCsv(scenario);
  assert.match(csv, /SECRET_LABEL/);
  assert.match(csv, /987654.32/);
  assert.doesNotMatch(csv, /^"id"/u);
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="export-buyers-csv"/u);
  assert.match(buyerPanel, /Export organizer buyer CSV/u);
  assert.equal(merchantPanel.includes("export-buyers-csv"), false);
  assert.match(app, /This is not a merchant export/u);
});

test("private review packets stay in the buyer room and are never merchant exports", async () => {
  const scenario = secretNeighbourhood();
  const packet = createCartReviewPacket(scenario, "coverage");
  const json = JSON.stringify(packet);
  assert.match(json, /SECRET_LABEL/);
  assert.match(json, /common-cart-review/);
  assert.equal(packet.review.rows.some((row) => row.includes("SECRET_LABEL")), true);
  const merchantSafeReviews = ["dependency", "frontier", "shipping", "capacity", "minimum"];
  for (const tool of merchantSafeReviews) {
    const review = JSON.stringify(analyzeCartReview(scenario, tool));
    assert.equal(review.includes("SECRET_LABEL"), false);
    assert.equal(review.includes("SECRET_ID"), false);
    assert.equal(review.includes("987654.32"), false);
    assert.equal(review.includes('"selectedBuyerIds":'), false);
    assert.equal(review.includes('"allocations":'), false);
  }
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="cart-review"/u);
  assert.match(buyerPanel, /organizer-only view can contain private buyer labels/u);
  assert.match(buyerPanel, /Export private review/u);
  assert.equal(merchantPanel.includes("cart-review"), false);
  assert.equal(merchantPanel.includes("createCartReviewPacket"), false);
  assert.match(app, /Private review packet exported/u);
  assert.match(app, /common-cart-private-review\.json/u);
  assert.match(html, /class="panel print-chrome cart-review"/u);
});
