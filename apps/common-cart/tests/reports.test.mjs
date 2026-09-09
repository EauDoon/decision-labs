import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, createMerchantReport, createBuyerCsv, createMerchantResidualReport, evaluateMarket } from "../src/model.js";

test("merchant report has an explicit privacy boundary and recomputed totals", () => {
  const s = clonePreset();
  s.title = "PRIVATE_TITLE";
  s.buyers[0].label = "PRIVATE_LABEL"; s.buyers[0].id = "PRIVATE_ID";
  s.buyers[0].maxOrderTotal = 123456.78;
  const report = createMerchantReport(s); const json = JSON.stringify(report);
  for (const value of ["PRIVATE_TITLE", "PRIVATE_LABEL", "PRIVATE_ID", "123456.78", '"selectedBuyerIds":', '"allocations":', '"maxUnitPrice":']) assert.ok(!json.includes(value), value);
  assert.equal(report.requestedUnits, evaluateMarket(s).totalRequestedUnits);
  assert.deepEqual(Object.keys(report.offers[0]), ["merchant", "category", "variant", "fulfillment", "status", "fulfilledUnits", "includedBuyerCount", "itemPrice", "landedTotal", "deliveryDays"]);
  assert.throws(() => createMerchantReport({}));
});

test("private CSV includes every buyer outcome and neutralizes formula-like text", () => {
  const s = clonePreset();
  s.buyers[0].label = '=HYPERLINK("malicious")';
  s.offers[0].merchant = "+cmd";
  const csv = createBuyerCsv(s, s.offers[0].id);
  assert.ok(csv.includes('"\'=HYPERLINK(""malicious"")"'));
  assert.ok(csv.includes('"\'+cmd"'));
  assert.equal(csv.trim().split("\r\n").length, s.buyers.length + 1);
  assert.ok(csv.includes("Order total"));
  assert.throws(() => createBuyerCsv(s, "missing"));
});

test("merchant residual report omits leftover buyer ids and labels", () => {
  const s = clonePreset("neighbourhood");
  s.buyers[0].label = "PRIVATE_LABEL";
  s.buyers[0].id = "PRIVATE_ID";
  const report = createMerchantResidualReport(s);
  const json = JSON.stringify(report);
  assert.equal(json.includes("PRIVATE_LABEL"), false);
  assert.equal(json.includes("PRIVATE_ID"), false);
  assert.equal(json.includes("leftoverBuyerIds"), false);
  assert.equal(json.includes("selectedBuyerIds"), false);
  assert.equal(typeof report.leftoverBuyerCount, "number");
  assert.equal(Object.hasOwn(report, "tertiary"), true);
  assert.match(report.limitations, /not a dual checkout/i);
});
