import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, evaluateMarket, redactBuyerLabels, validateScenario, encodeScenario, encodeRedactedScenario, decodeScenario, createOfferIdentityCompareMarkdown, createVariantOverlapMarkdown, createExclusionCountsMarkdown } from "../src/model.js";

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
});

test("exclusion counts markdown omits buyer labels, ids, budgets, and allocations", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createExclusionCountsMarkdown(scenario, scenario.offers[1].id);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes('"selectedBuyerIds":'), false);
  assert.equal(markdown.includes('"allocations":'), false);
  assert.match(markdown, /omit private buyer labels, IDs, budgets, and allocations/);
});
