import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, evaluateMarket, validateScenario } from "../src/model.js";

function room() {
  const s = clonePreset();
  s.buyers = [{ ...s.buyers[0], quantity: 3, maxUnitPrice: 1 }];
  s.offers = [{ ...s.offers[0], category: s.buyers[0].category, variant: s.buyers[0].allowedVariants[0], unitPrice: 0.1, shippingPerBuyer: 0.2, minimumUnits: 1, capacity: 10, deliveryDays: 0 }];
  return s;
}
test("landed budget is inclusive, accounts for shipping, and survives validation", () => {
  const s = room(); s.buyers[0].maxOrderTotal = 0.5;
  assert.equal(evaluateMarket(s).winner.fulfilledUnits, 3);
  assert.equal(validateScenario(s).buyers[0].maxOrderTotal, 0.5);
  s.buyers[0].maxOrderTotal = 0.49;
  assert.equal(evaluateMarket(s).winner, null);
  assert.deepEqual(evaluateMarket(s).results[0].buyerOutcomes[0].reasons, ["budget"]);
});
test("omitted budget preserves previous item-only compatibility", () => {
  const s = room(); s.offers[0].shippingPerBuyer = 100;
  assert.ok(evaluateMarket(s).winner);
  assert.equal(Object.hasOwn(validateScenario(s).buyers[0], "maxOrderTotal"), false);
  for (const value of [null, "", -1, Infinity]) {
    s.buyers[0].maxOrderTotal = value;
    assert.throws(() => validateScenario(s));
  }
});
