import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, createMerchantReport, evaluateMarket } from "../src/model.js";

test("merchant report has an explicit privacy boundary and recomputed totals", () => {
  const s = clonePreset();
  s.title = "PRIVATE_TITLE";
  s.buyers[0].label = "PRIVATE_LABEL"; s.buyers[0].id = "PRIVATE_ID";
  s.buyers[0].maxOrderTotal = 123456.78;
  const report = createMerchantReport(s); const json = JSON.stringify(report);
  for (const value of ["PRIVATE_TITLE", "PRIVATE_LABEL", "PRIVATE_ID", "123456.78", '"selectedBuyerIds":', '"allocations":', '"maxUnitPrice":']) assert.ok(!json.includes(value), value);
  assert.equal(report.requestedUnits, evaluateMarket(s).totalRequestedUnits);
  assert.deepEqual(Object.keys(report.offers[0]), ["merchant", "category", "variant", "status", "fulfilledUnits", "includedBuyerCount", "itemPrice", "landedTotal", "deliveryDays"]);
  assert.throws(() => createMerchantReport({}));
});
