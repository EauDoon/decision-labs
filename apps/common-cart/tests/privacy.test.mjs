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

test("merchant surfaces omit leftover uncovered remaining copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-remaining"/u);
  assert.match(buyerPanel, /Leftover uncovered remaining copy is remaining uncovered leftover units as a count/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-remaining"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered remaining"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered remaining copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredRemainingMarkdown"), false);
  const leftoverUncoveredRemaining = createLeftoverUncoveredRemainingMarkdown(secretNeighbourhood());
  assert.match(leftoverUncoveredRemaining, /organizer private/);
  assert.match(leftoverUncoveredRemaining, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverUncoveredRemaining, ["SECRET_TITLE"]);
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
    assert.equal(String(text).includes("leftover uncovered remaining (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-remaining"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover uncovered maximum copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-maximum"/u);
  assert.match(buyerPanel, /Leftover uncovered maximum copy is leftover-fill offer capacity as a count/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-maximum"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered maximum"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered maximum copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredMaximumMarkdown"), false);
  const leftoverUncoveredMaximum = createLeftoverUncoveredMaximumMarkdown(secretNeighbourhood());
  assert.match(leftoverUncoveredMaximum, /organizer private/);
  assert.match(leftoverUncoveredMaximum, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverUncoveredMaximum, ["SECRET_TITLE"]);
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
    assert.equal(String(text).includes("leftover uncovered maximum (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-maximum"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover uncovered minimum copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-minimum"/u);
  assert.match(buyerPanel, /Leftover uncovered minimum copy is leftover-fill offer minimum units as a count/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-minimum"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered minimum"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered minimum copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredMinimumMarkdown"), false);
  const leftoverUncoveredMinimum = createLeftoverUncoveredMinimumMarkdown(secretNeighbourhood());
  assert.match(leftoverUncoveredMinimum, /organizer private/);
  assert.match(leftoverUncoveredMinimum, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverUncoveredMinimum, ["SECRET_TITLE"]);
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
    assert.equal(String(text).includes("leftover uncovered minimum (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-minimum"), false);
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

test("merchant surfaces omit leftover fill remaining capacity copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-remaining"/u);
  assert.match(buyerPanel, /Leftover fill remaining-capacity copy is remaining capacity on the leftover-fill offer/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-remaining"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill remaining capacity"), false);
  assert.equal(merchantPanel.includes("Leftover fill remaining-capacity copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverFillRemainingCapacityMarkdown"), false);
  const leftoverFillRemaining = createLeftoverFillRemainingCapacityMarkdown(secretNeighbourhood());
  assert.match(leftoverFillRemaining, /organizer private/);
  assert.match(leftoverFillRemaining, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverFillRemaining, ["SECRET_TITLE"]);
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
    assert.equal(String(text).includes("leftover fill remaining capacity (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-fill-remaining"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover fill fulfillment copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-fulfillment"/u);
  assert.match(buyerPanel, /Leftover fill fulfillment copy is pickup or shipping on the leftover-fill offer/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-fulfillment"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill fulfillment"), false);
  assert.equal(merchantPanel.includes("Leftover fill fulfillment copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverFillFulfillmentMarkdown"), false);
  const leftoverFillFulfillment = createLeftoverFillFulfillmentMarkdown(secretNeighbourhood());
  assert.match(leftoverFillFulfillment, /organizer private/);
  assert.match(leftoverFillFulfillment, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverFillFulfillment, ["SECRET_TITLE"]);
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
    assert.equal(String(text).includes("leftover fill fulfillment (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-fill-fulfillment"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover fill delivery copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-delivery"/u);
  assert.match(buyerPanel, /Leftover fill delivery copy is leftover-fill delivery days as a count/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-delivery"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill delivery"), false);
  assert.equal(merchantPanel.includes("Leftover fill delivery copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverFillDeliveryMarkdown"), false);
  const leftoverFillDelivery = createLeftoverFillDeliveryMarkdown(secretNeighbourhood());
  assert.match(leftoverFillDelivery, /organizer private/);
  assert.match(leftoverFillDelivery, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverFillDelivery, ["SECRET_TITLE"]);
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
    assert.equal(String(text).includes("leftover fill delivery (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-fill-delivery"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover fill pickup copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-pickup"/u);
  assert.match(buyerPanel, /Leftover fill pickup copy is leftover-fill pickup days as a count when leftover fill is pickup/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-pickup"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill pickup"), false);
  assert.equal(merchantPanel.includes("Leftover fill pickup copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverFillPickupMarkdown"), false);
  const leftoverFillPickup = createLeftoverFillPickupMarkdown(secretNeighbourhood());
  assert.match(leftoverFillPickup, /organizer private/);
  assert.match(leftoverFillPickup, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverFillPickup, ["SECRET_TITLE"]);
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
    assert.equal(String(text).includes("leftover fill pickup (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-fill-pickup"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover fill label copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-fill-label"/u);
  assert.match(buyerPanel, /Leftover fill label copy is leftover-fill offer label as merchant and variant/u);
  assert.equal(merchantPanel.includes("copy-leftover-fill-label"), false);
  assert.equal(merchantPanel.includes("Copy leftover fill label"), false);
  assert.equal(merchantPanel.includes("Leftover fill label copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverFillLabelMarkdown"), false);
  const leftoverFillLabel = createLeftoverFillLabelMarkdown(secretNeighbourhood());
  assert.match(leftoverFillLabel, /organizer private/);
  assert.match(leftoverFillLabel, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverFillLabel, ["SECRET_TITLE"]);
  const leftoverFillMinimum = createLeftoverFillMinimumMarkdown(secretNeighbourhood());
  assert.match(leftoverFillMinimum, /organizer private/);
  assert.match(leftoverFillMinimum, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverFillMinimum, ["SECRET_TITLE"]);
  const leftoverFillMaximum = createLeftoverFillMaximumMarkdown(secretNeighbourhood());
  assert.match(leftoverFillMaximum, /organizer private/);
  assert.match(leftoverFillMaximum, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverFillMaximum, ["SECRET_TITLE"]);
  const tertiaryFillRemaining = createTertiaryFillRemainingCapacityMarkdown(secretNeighbourhood());
  assert.match(tertiaryFillRemaining, /organizer private/);
  assert.match(tertiaryFillRemaining, /Not a merchant export/);
  assertOmitsPrivateBuyers(tertiaryFillRemaining, ["SECRET_TITLE"]);
  const tertiaryFillMaximum = createTertiaryFillMaximumMarkdown(secretNeighbourhood());
  assert.match(tertiaryFillMaximum, /organizer private/);
  assert.match(tertiaryFillMaximum, /Not a merchant export/);
  assertOmitsPrivateBuyers(tertiaryFillMaximum, ["SECRET_TITLE"]);
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
    assert.equal(String(text).includes("leftover fill label (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-fill-label"), false);
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
  assert.match(leftover, /leftover-print-fill-fulfillment/u);
  assert.match(leftover, /Leftover fill fulfillment: none/u);
  assert.match(leftover, /leftover-print-fill-delivery/u);
  assert.match(leftover, /Leftover fill delivery days: none/u);
  assert.match(leftover, /leftover-print-fill-pickup/u);
  assert.match(leftover, /Leftover fill pickup days: none/u);
  assert.match(leftover, /leftover-print-fill-label/u);
  assert.match(leftover, /Leftover fill label: none/u);
  assert.match(leftover, /leftover-print-fill-minimum/u);
  assert.match(leftover, /Leftover fill minimum: none/u);
  assert.match(leftover, /leftover-print-fill-maximum/u);
  assert.match(leftover, /Leftover fill maximum: none/u);
  assert.match(leftover, /leftover-print-tertiary-remaining/u);
  assert.match(leftover, /Tertiary fill remaining capacity: none/u);
  assert.match(leftover, /leftover-print-tertiary-maximum/u);
  assert.match(leftover, /Tertiary fill maximum: none/u);
  assert.match(leftover, /leftover-print-uncovered-remaining/u);
  assert.match(leftover, /Leftover uncovered remaining: none/u);
  assert.match(leftover, /leftover-print-uncovered-maximum/u);
  assert.match(leftover, /Leftover uncovered maximum: none/u);
  assert.match(leftover, /leftover-print-uncovered-minimum/u);
  assert.match(leftover, /Leftover uncovered minimum: none/u);
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
  assert.equal(merchantPanel.includes("leftover-print-fill-fulfillment"), false);
  assert.equal(merchantPanel.includes("leftover-print-fill-delivery"), false);
  assert.equal(merchantPanel.includes("leftover-print-fill-pickup"), false);
  assert.equal(merchantPanel.includes("leftover-print-fill-label"), false);
  assert.equal(merchantPanel.includes("leftover-print-fill-minimum"), false);
  assert.equal(merchantPanel.includes("leftover-print-fill-maximum"), false);
  assert.equal(merchantPanel.includes("leftover-print-tertiary-remaining"), false);
  assert.equal(merchantPanel.includes("leftover-print-tertiary-maximum"), false);
  assert.equal(merchantPanel.includes("leftover-print-uncovered-remaining"), false);
  assert.equal(merchantPanel.includes("leftover-print-uncovered-maximum"), false);
  assert.equal(merchantPanel.includes("leftover-print-uncovered-minimum"), false);
  assert.equal(merchantPanel.includes("leftover-print-uncovered-count"), false);
  assert.equal(merchantPanel.includes("hide-first-buyer-filled-by-leftover-fill"), false);
  assert.equal(merchantPanel.includes("hideFirstBuyerFilledByLeftoverFill"), false);
  assert.equal(merchantPanel.includes("hide-first-buyer-filled-by-tertiary-fill"), false);
  assert.equal(merchantPanel.includes("hideFirstBuyerFilledByTertiaryFill"), false);
  assert.equal(merchantPanel.includes("hide-last-buyer-filled-by-tertiary-fill"), false);
  assert.equal(merchantPanel.includes("hideLastBuyerFilledByTertiaryFill"), false);
  assert.equal(merchantPanel.includes("hide-last-unserved-buyer"), false);
  assert.equal(merchantPanel.includes("hideLastUnservedBuyer"), false);
  assert.equal(merchantPanel.includes("hide-first-unserved-buyer"), false);
  assert.equal(merchantPanel.includes("hideFirstUnservedBuyer"), false);
  assert.equal(merchantPanel.includes("hide-last-leftover-only-buyer"), false);
  assert.equal(merchantPanel.includes("hideLastLeftoverOnlyBuyer"), false);
  assert.equal(merchantPanel.includes("hide-first-leftover-only-buyer"), false);
  assert.equal(merchantPanel.includes("hideFirstLeftoverOnlyBuyer"), false);
  assert.equal(merchantPanel.includes("hide-last-winner-allocated-buyer"), false);
  assert.equal(merchantPanel.includes("hideLastWinnerAllocatedBuyer"), false);
  assert.equal(merchantPanel.includes("hide-first-winner-allocated-buyer"), false);
  assert.equal(merchantPanel.includes("hideFirstWinnerAllocatedBuyer"), false);
  assert.equal(merchantPanel.includes("copy-leftover-fill-label"), false);
  assert.equal(merchantPanel.includes("copy-leftover-fill-minimum"), false);
  assert.equal(merchantPanel.includes("copy-leftover-fill-maximum"), false);
  assert.equal(merchantPanel.includes("copy-tertiary-fill-remaining"), false);
  assert.equal(merchantPanel.includes("copy-tertiary-fill-maximum"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-remaining"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-maximum"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-minimum"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-count"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-count"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-remaining"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-maximum"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-minimum"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-headroom"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-allocated"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-capacity"), false);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-unit-price"), false);
  assert.equal(merchantPanel.includes("hide-first-uncovered-leftover-buyer"), false);
  assert.equal(merchantPanel.includes("hideFirstUncoveredLeftoverBuyer"), false);
  assert.equal(merchantPanel.includes("hide-last-uncovered-leftover-buyer"), false);
  assert.equal(merchantPanel.includes("hideLastUncoveredLeftoverBuyer"), false);
});

test("merchant surfaces omit leftover uncovered leftover-only count copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-count"/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only count copy is leftover-only buyer count/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-count"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only count"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only count copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredLeftoverOnlyCountMarkdown"), false);
  const leftoverOnlyCount = createLeftoverUncoveredLeftoverOnlyCountMarkdown(secretNeighbourhood());
  assert.match(leftoverOnlyCount, /organizer private/);
  assert.match(leftoverOnlyCount, /Not a merchant export/);
  assert.match(leftoverOnlyCount, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyCount, /leftover uncovered count \(organizer private\)/);
  assertOmitsPrivateBuyers(leftoverOnlyCount, ["SECRET_TITLE"]);
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
    assert.equal(String(text).includes("leftover uncovered leftover-only count (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-leftover-only-count"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover uncovered leftover-only remaining copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-remaining"/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only remaining copy is leftover-only buyer units after the winner/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-remaining"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only remaining"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only remaining copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredLeftoverOnlyRemainingMarkdown"), false);
  const leftoverOnlyRemaining = createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(secretNeighbourhood());
  assert.match(leftoverOnlyRemaining, /organizer private/);
  assert.match(leftoverOnlyRemaining, /Not a merchant export/);
  assert.match(leftoverOnlyRemaining, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyRemaining, /leftover uncovered remaining \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyRemaining, /leftover uncovered leftover-only count \(organizer private\)/);
  assertOmitsPrivateBuyers(leftoverOnlyRemaining, ["SECRET_TITLE"]);
  const remainingLeft = secretNeighbourhood();
  const remainingMerchantSurfaces = [
    JSON.stringify(createMerchantReport(remainingLeft)),
    JSON.stringify(createMerchantResidualReport(remainingLeft)),
    createWinnerAggregatesMarkdown(remainingLeft),
    createDeliveryHeatmapCsv(remainingLeft),
    createOfferCsv(remainingLeft),
    createVariantOverlapCsv(remainingLeft),
    createVariantOverlapMarkdown(remainingLeft),
    createExclusionCountsMarkdown(remainingLeft, remainingLeft.offers[1].id),
    createWinningMerchantLabelMarkdown(remainingLeft),
    createWinningFulfillmentMarkdown(remainingLeft),
    createWinningRemainingCapacityMarkdown(remainingLeft)
  ];
  for (const text of remainingMerchantSurfaces) {
    assert.equal(String(text).includes("leftover uncovered leftover-only remaining (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-leftover-only-remaining"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover uncovered leftover-only maximum copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-maximum"/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only maximum copy is the largest leftover-only buyer quantity/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-maximum"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only maximum"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only maximum copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredLeftoverOnlyMaximumMarkdown"), false);
  const leftoverOnlyMaximum = createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(secretNeighbourhood());
  assert.match(leftoverOnlyMaximum, /organizer private/);
  assert.match(leftoverOnlyMaximum, /Not a merchant export/);
  assert.match(leftoverOnlyMaximum, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyMaximum, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyMaximum, /leftover uncovered leftover-only count \(organizer private\)/);
  assertOmitsPrivateBuyers(leftoverOnlyMaximum, ["SECRET_TITLE"]);
  const maximumLeft = secretNeighbourhood();
  const maximumMerchantSurfaces = [
    JSON.stringify(createMerchantReport(maximumLeft)),
    JSON.stringify(createMerchantResidualReport(maximumLeft)),
    createWinnerAggregatesMarkdown(maximumLeft),
    createDeliveryHeatmapCsv(maximumLeft),
    createOfferCsv(maximumLeft),
    createVariantOverlapCsv(maximumLeft),
    createVariantOverlapMarkdown(maximumLeft),
    createExclusionCountsMarkdown(maximumLeft, maximumLeft.offers[1].id),
    createWinningMerchantLabelMarkdown(maximumLeft),
    createWinningFulfillmentMarkdown(maximumLeft),
    createWinningRemainingCapacityMarkdown(maximumLeft)
  ];
  for (const text of maximumMerchantSurfaces) {
    assert.equal(String(text).includes("leftover uncovered leftover-only maximum (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-leftover-only-maximum"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover uncovered leftover-only minimum copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-minimum"/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only minimum copy is the smallest leftover-only buyer quantity/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-minimum"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only minimum"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only minimum copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredLeftoverOnlyMinimumMarkdown"), false);
  const leftoverOnlyMinimum = createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(secretNeighbourhood());
  assert.match(leftoverOnlyMinimum, /organizer private/);
  assert.match(leftoverOnlyMinimum, /Not a merchant export/);
  assert.match(leftoverOnlyMinimum, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyMinimum, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyMinimum, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyMinimum, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyMinimum, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyMinimum, /leftover uncovered minimum \(organizer private\)/);
  assertOmitsPrivateBuyers(leftoverOnlyMinimum, ["SECRET_TITLE"]);
  const minimumLeft = secretNeighbourhood();
  const minimumMerchantSurfaces = [
    JSON.stringify(createMerchantReport(minimumLeft)),
    JSON.stringify(createMerchantResidualReport(minimumLeft)),
    createWinnerAggregatesMarkdown(minimumLeft),
    createDeliveryHeatmapCsv(minimumLeft),
    createOfferCsv(minimumLeft),
    createVariantOverlapCsv(minimumLeft),
    createVariantOverlapMarkdown(minimumLeft),
    createExclusionCountsMarkdown(minimumLeft, minimumLeft.offers[1].id),
    createWinningMerchantLabelMarkdown(minimumLeft),
    createWinningFulfillmentMarkdown(minimumLeft),
    createWinningRemainingCapacityMarkdown(minimumLeft)
  ];
  for (const text of minimumMerchantSurfaces) {
    assert.equal(String(text).includes("leftover uncovered leftover-only minimum (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-leftover-only-minimum"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover uncovered leftover-only headroom copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-headroom"/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only headroom copy is leftover-fill remaining capacity after leftover-only units/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-headroom"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only headroom"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only headroom copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown"), false);
  const leftoverOnlyHeadroom = createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(secretNeighbourhood());
  assert.match(leftoverOnlyHeadroom, /organizer private/);
  assert.match(leftoverOnlyHeadroom, /Not a merchant export/);
  assert.match(leftoverOnlyHeadroom, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyHeadroom, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyHeadroom, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyHeadroom, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyHeadroom, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyHeadroom, /leftover uncovered remaining \(organizer private\)/);
  assertOmitsPrivateBuyers(leftoverOnlyHeadroom, ["SECRET_TITLE"]);
  const headroomLeft = secretNeighbourhood();
  const headroomMerchantSurfaces = [
    JSON.stringify(createMerchantReport(headroomLeft)),
    JSON.stringify(createMerchantResidualReport(headroomLeft)),
    createWinnerAggregatesMarkdown(headroomLeft),
    createDeliveryHeatmapCsv(headroomLeft),
    createOfferCsv(headroomLeft),
    createVariantOverlapCsv(headroomLeft),
    createVariantOverlapMarkdown(headroomLeft),
    createExclusionCountsMarkdown(headroomLeft, headroomLeft.offers[1].id),
    createWinningMerchantLabelMarkdown(headroomLeft),
    createWinningFulfillmentMarkdown(headroomLeft),
    createWinningRemainingCapacityMarkdown(headroomLeft)
  ];
  for (const text of headroomMerchantSurfaces) {
    assert.equal(String(text).includes("leftover uncovered leftover-only headroom (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-leftover-only-headroom"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover uncovered leftover-only allocated copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-allocated"/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only allocated copy is leftover-only units assigned onto leftover-fill/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-allocated"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only allocated"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only allocated copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown"), false);
  const leftoverOnlyAllocated = createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(secretNeighbourhood());
  assert.match(leftoverOnlyAllocated, /organizer private/);
  assert.match(leftoverOnlyAllocated, /Not a merchant export/);
  assert.match(leftoverOnlyAllocated, /leftover uncovered leftover-only allocated \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyAllocated, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyAllocated, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyAllocated, /leftover uncovered leftover-only count \(organizer private\)/);
  assertOmitsPrivateBuyers(leftoverOnlyAllocated, ["SECRET_TITLE"]);
  const allocatedLeft = secretNeighbourhood();
  const allocatedMerchantSurfaces = [
    JSON.stringify(createMerchantReport(allocatedLeft)),
    JSON.stringify(createMerchantResidualReport(allocatedLeft)),
    createWinnerAggregatesMarkdown(allocatedLeft),
    createDeliveryHeatmapCsv(allocatedLeft),
    createOfferCsv(allocatedLeft),
    createVariantOverlapCsv(allocatedLeft),
    createVariantOverlapMarkdown(allocatedLeft),
    createExclusionCountsMarkdown(allocatedLeft, allocatedLeft.offers[1].id),
    createWinningMerchantLabelMarkdown(allocatedLeft),
    createWinningFulfillmentMarkdown(allocatedLeft),
    createWinningRemainingCapacityMarkdown(allocatedLeft)
  ];
  for (const text of allocatedMerchantSurfaces) {
    assert.equal(String(text).includes("leftover uncovered leftover-only allocated (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-leftover-only-allocated"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover uncovered leftover-only capacity copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-capacity"/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only capacity copy is leftover-fill offer capacity/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-capacity"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only capacity"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only capacity copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredLeftoverOnlyCapacityMarkdown"), false);
  const leftoverOnlyCapacity = createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(secretNeighbourhood());
  assert.match(leftoverOnlyCapacity, /organizer private/);
  assert.match(leftoverOnlyCapacity, /Not a merchant export/);
  assert.match(leftoverOnlyCapacity, /leftover uncovered leftover-only capacity \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyCapacity, /leftover uncovered leftover-only allocated \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyCapacity, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyCapacity, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyCapacity, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyCapacity, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyCapacity, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assertOmitsPrivateBuyers(leftoverOnlyCapacity, ["SECRET_TITLE"]);
  const capacityLeft = secretNeighbourhood();
  const capacityMerchantSurfaces = [
    JSON.stringify(createMerchantReport(capacityLeft)),
    JSON.stringify(createMerchantResidualReport(capacityLeft)),
    createWinnerAggregatesMarkdown(capacityLeft),
    createDeliveryHeatmapCsv(capacityLeft),
    createOfferCsv(capacityLeft),
    createVariantOverlapCsv(capacityLeft),
    createVariantOverlapMarkdown(capacityLeft),
    createExclusionCountsMarkdown(capacityLeft, capacityLeft.offers[1].id),
    createWinningMerchantLabelMarkdown(capacityLeft),
    createWinningFulfillmentMarkdown(capacityLeft),
    createWinningRemainingCapacityMarkdown(capacityLeft)
  ];
  for (const text of capacityMerchantSurfaces) {
    assert.equal(String(text).includes("leftover uncovered leftover-only capacity (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-leftover-only-capacity"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover uncovered leftover-only unit price copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-leftover-only-unit-price"/u);
  assert.match(buyerPanel, /Leftover uncovered leftover-only unit price copy is leftover-fill offer unit price/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-leftover-only-unit-price"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered leftover-only unit price"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered leftover-only unit price copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown"), false);
  const leftoverOnlyUnitPrice = createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(secretNeighbourhood());
  assert.match(leftoverOnlyUnitPrice, /organizer private/);
  assert.match(leftoverOnlyUnitPrice, /Not a merchant export/);
  assert.match(leftoverOnlyUnitPrice, /leftover uncovered leftover-only unit price \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyUnitPrice, /leftover uncovered leftover-only capacity \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyUnitPrice, /leftover uncovered leftover-only allocated \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyUnitPrice, /leftover uncovered leftover-only headroom \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyUnitPrice, /leftover uncovered leftover-only remaining \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyUnitPrice, /leftover uncovered leftover-only count \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyUnitPrice, /leftover uncovered leftover-only minimum \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyUnitPrice, /leftover uncovered leftover-only maximum \(organizer private\)/);
  assert.doesNotMatch(leftoverOnlyUnitPrice, /leftover unit price \(organizer private\)/);
  assertOmitsPrivateBuyers(leftoverOnlyUnitPrice, ["SECRET_TITLE"]);
  const unitPriceLeft = secretNeighbourhood();
  const unitPriceMerchantSurfaces = [
    JSON.stringify(createMerchantReport(unitPriceLeft)),
    JSON.stringify(createMerchantResidualReport(unitPriceLeft)),
    createWinnerAggregatesMarkdown(unitPriceLeft),
    createDeliveryHeatmapCsv(unitPriceLeft),
    createOfferCsv(unitPriceLeft),
    createVariantOverlapCsv(unitPriceLeft),
    createVariantOverlapMarkdown(unitPriceLeft),
    createExclusionCountsMarkdown(unitPriceLeft, unitPriceLeft.offers[1].id),
    createWinningMerchantLabelMarkdown(unitPriceLeft),
    createWinningFulfillmentMarkdown(unitPriceLeft),
    createWinningRemainingCapacityMarkdown(unitPriceLeft)
  ];
  for (const text of unitPriceMerchantSurfaces) {
    assert.equal(String(text).includes("leftover uncovered leftover-only unit price (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-leftover-only-unit-price"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
});

test("merchant surfaces omit leftover uncovered count copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-leftover-uncovered-count"/u);
  assert.match(buyerPanel, /Leftover uncovered count copy is uncovered leftover buyer count/u);
  assert.equal(merchantPanel.includes("copy-leftover-uncovered-count"), false);
  assert.equal(merchantPanel.includes("Copy leftover uncovered count"), false);
  assert.equal(merchantPanel.includes("Leftover uncovered count copy"), false);
  assert.equal(merchantPanel.includes("createLeftoverUncoveredCountMarkdown"), false);
  const leftoverUncoveredCount = createLeftoverUncoveredCountMarkdown(secretNeighbourhood());
  assert.match(leftoverUncoveredCount, /organizer private/);
  assert.match(leftoverUncoveredCount, /Not a merchant export/);
  assertOmitsPrivateBuyers(leftoverUncoveredCount, ["SECRET_TITLE"]);
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
    assert.equal(String(text).includes("leftover uncovered count (organizer private)"), false);
    assert.equal(String(text).includes("copy-leftover-uncovered-count"), false);
    assert.equal(String(text).includes("Not a merchant export"), false);
    assertOmitsPrivateBuyers(text, ["SECRET_TITLE"]);
  }
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
