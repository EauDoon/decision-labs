import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, groupExclusionReasons, evaluateOffer } from "../src/model.js";

test("exclusion grouping counts reason codes and keeps per-buyer outcomes", () => {
  const scenario = clonePreset("neighbourhood");
  const groups = groupExclusionReasons(scenario, "O02");
  const codes = groups.map((group) => group.code);
  assert.ok(codes.includes("variant") || codes.includes("price") || codes.includes("delivery"));
  assert.equal(groups.every((group) => group.count === group.buyerIds.length), true);
  const result = evaluateOffer(scenario, "O02");
  assert.ok(result.buyerOutcomes.length === scenario.buyers.length);
  assert.ok(result.buyerOutcomes.some((outcome) => outcome.status === "included"));
  assert.ok(result.buyerOutcomes.some((outcome) => outcome.status !== "included"));
});

test("capacity leftover and quantity vs remaining capacity are distinct groups", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers = [
    { ...scenario.buyers[0], id: "B01", quantity: 8, allowedVariants: ["Medium roast"], maxUnitPrice: 40, latestDeliveryDays: 10 },
    { ...scenario.buyers[0], id: "B02", quantity: 3, allowedVariants: ["Medium roast"], maxUnitPrice: 40, latestDeliveryDays: 10 },
    { ...scenario.buyers[0], id: "B03", quantity: 12, allowedVariants: ["Medium roast"], maxUnitPrice: 40, latestDeliveryDays: 10 }
  ];
  scenario.offers = [{ ...scenario.offers[0], id: "O01", variant: "Medium roast", minimumUnits: 8, capacity: 10, unitPrice: 20, deliveryDays: 5 }];
  const result = evaluateOffer(scenario, "O01");
  assert.equal(result.qualifies, true);
  assert.deepEqual(result.selectedBuyerIds, ["B01"]);
  const groups = Object.fromEntries(groupExclusionReasons(scenario, "O01").map((group) => [group.code, group]));
  assert.equal(groups.quantity_vs_capacity.count, 1);
  assert.deepEqual(groups.quantity_vs_capacity.buyerIds, ["B03"]);
  assert.equal(groups.capacity_leftover.count, 1);
  assert.deepEqual(groups.capacity_leftover.buyerIds, ["B02"]);
});
