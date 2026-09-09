import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, evaluateMarket, redactBuyerLabels, validateScenario } from "../src/model.js";

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
