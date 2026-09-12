import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  clonePreset, validateScenario, planMultiMerchant, planContingency, planContingencies,
  standardContingencySet, createMerchantContingencyReport, analyzeCartReview,
  CART_REVIEW_TOOLS, createCartReviewPacket, replayCartReviewPacket,
} from "../src/model.js";

const cli = fileURLToPath(new URL("../scripts/analyze.mjs", import.meta.url));

function splitScenario() {
  return validateScenario({
    title: "Split test", currency: "USD",
    buyers: [
      { id: "B1", label: "One", category: "Beans", quantity: 5, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Whole"] },
      { id: "B2", label: "Two", category: "Beans", quantity: 5, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Whole"] },
      { id: "B3", label: "Three", category: "Beans", quantity: 5, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Whole"] },
    ],
    offers: [
      { id: "O1", merchant: "Alpha", category: "Beans", variant: "Whole", unitPrice: 20, minimumUnits: 1, deliveryDays: 5, capacity: 10, shippingPerBuyer: 5, fulfillment: "shipping" },
      { id: "O2", merchant: "Beta", category: "Beans", variant: "Whole", unitPrice: 22, minimumUnits: 1, deliveryDays: 5, capacity: 10, shippingPerBuyer: 0, fulfillment: "pickup" },
    ],
  });
}

test("withdrawal replans identical demand and names lost orders", () => {
  const result = planContingency(splitScenario(), { type: "withdraw", offerId: "O1" });
  assert.equal(result.baseline.fulfilledUnits, 15);
  assert.equal(result.contingency.fulfilledUnits, 10);
  assert.equal(result.fulfilledUnitsDelta, -5);
  assert.deepEqual(result.lostOrders.map((entry) => entry.buyerId).sort(), ["B3"]);
  assert.equal(result.lostUnits, 5);
  assert.deepEqual(result.newlyFeasible, []);
  assert.match(result.description, /Withdraw Alpha \/ O1/);
  assert.match(result.note, /identical buyer demand/);
});

test("capacity reduction keeps served orders until the cap binds", () => {
  const mild = planContingency(splitScenario(), { type: "capacity", offerId: "O1", capacity: 10 });
  assert.equal(mild.fulfilledUnitsDelta, 0);
  assert.deepEqual(mild.lostOrders, []);
  const tight = planContingency(splitScenario(), { type: "capacity", offerId: "O1", capacity: 5 });
  assert.ok(tight.fulfilledUnitsDelta <= 0);
  const capped = tight.assignments.find((entry) => entry.offerId === "O1");
  assert.ok(!capped || capped.units <= 5);
});

test("price scaling reprices every band and can price buyers out", () => {
  const result = planContingency(splitScenario(), { type: "price", offerId: "O1", priceMultiplier: 2 });
  assert.ok(result.fulfilledUnitsDelta <= 0);
  const extreme = planContingency(splitScenario(), { type: "price", offerId: "O1", priceMultiplier: 10 });
  assert.ok(extreme.contingency.fulfilledUnits <= result.contingency.fulfilledUnits);
});

test("delivery delay removes orders past their deadline", () => {
  const result = planContingency(splitScenario(), { type: "delay", offerId: "O1", deliveryDays: 30 });
  assert.ok(result.lostOrders.length > 0);
  assert.match(result.description, /Delay Alpha \/ O1 delivery to 30 days/);
});

test("experiments validate types, offers, fields, and ranges", () => {
  const scenario = splitScenario();
  assert.throws(() => planContingency(scenario, null), /must be an object/);
  assert.throws(() => planContingency(scenario, { type: "remove", offerId: "O1" }), /withdraw, capacity, price, or delay/);
  assert.throws(() => planContingency(scenario, { type: "withdraw", offerId: "OX" }), /existing offer/);
  assert.throws(() => planContingency(scenario, { type: "withdraw", offerId: "O1", extra: 1 }), /unexpected field/);
  assert.throws(() => planContingency(scenario, { type: "capacity", offerId: "O1", capacity: -1 }), /whole number/);
  assert.throws(() => planContingency(scenario, { type: "price", offerId: "O1", priceMultiplier: 0 }), /above zero/);
  assert.throws(() => planContingency(scenario, { type: "price", offerId: "O1", priceMultiplier: 11 }), /at most 10/);
  assert.throws(() => planContingency(scenario, { type: "delay", offerId: "O1", deliveryDays: 366 }), /0 through 365/);
  assert.throws(() => planContingencies(scenario, []), /1 to 25/);
  assert.equal(planContingencies(scenario, [{ type: "withdraw", offerId: "O1" }]).length, 1);
});

test("standard set withdraws each planned merchant once", () => {
  const set = standardContingencySet(splitScenario());
  assert.deepEqual(set.map((entry) => entry.merchant).sort(), ["Alpha", "Beta"]);
  for (const entry of set) {
    assert.ok(entry.experiments.every((experiment) => experiment.type === "withdraw"));
  }
  const empty = standardContingencySet(validateScenario({
    title: "Empty", currency: "USD",
    buyers: [{ id: "B1", label: "One", category: "Beans", quantity: 5, maxUnitPrice: 1, latestDeliveryDays: 7, allowedVariants: ["Whole"] }],
    offers: [{ id: "O1", merchant: "Alpha", category: "Beans", variant: "Whole", unitPrice: 20, minimumUnits: 1, deliveryDays: 5, capacity: 10, shippingPerBuyer: 0, fulfillment: "pickup" }],
  }));
  assert.deepEqual(empty, []);
});

test("newly feasible orders appear when a capacity increase unlocks coverage", () => {
  const scenario = validateScenario({
    title: "Unlock test", currency: "USD",
    buyers: [
      { id: "B1", label: "One", category: "Beans", quantity: 6, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Whole"] },
      { id: "B2", label: "Two", category: "Beans", quantity: 6, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Whole"] },
      { id: "B3", label: "Three", category: "Beans", quantity: 6, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Whole"] },
    ],
    offers: [
      { id: "O1", merchant: "Alpha", category: "Beans", variant: "Whole", unitPrice: 10, minimumUnits: 1, deliveryDays: 5, capacity: 10, shippingPerBuyer: 0, fulfillment: "pickup" },
    ],
  });
  const base = planMultiMerchant(scenario);
  assert.equal(base.fulfilledUnits, 6);
  const result = planContingency(scenario, { type: "capacity", offerId: "O1", capacity: 18 });
  assert.equal(result.contingency.fulfilledUnits, 18);
  assert.equal(result.lostUnits, 0);
  assert.equal(result.newlyFeasibleUnits, 12);
  assert.deepEqual(result.newlyFeasible.map((entry) => entry.buyerId).sort(), ["B2", "B3"]);
});

test("merchant contingency summary carries aggregate deltas only", () => {
  const scenario = splitScenario();
  const summary = createMerchantContingencyReport(scenario, { type: "withdraw", offerId: "O1" });
  const text = JSON.stringify(summary);
  for (const token of ["B1", "B2", "B3", "One", "Two", "Three", "buyerId", "allocations", "lostOrders"]) {
    assert.equal(text.includes(`"${token}"`), false, token);
  }
  assert.equal(summary.baselineFulfilledUnits, 15);
  assert.equal(summary.contingencyFulfilledUnits, 10);
  assert.equal(summary.fulfilledUnitsDelta, -5);
  assert.equal(summary.lostUnits, 5);
  assert.match(summary.note, /Aggregate contingency projection only/);
});

test("contingency review tool withdraws each planned merchant deterministically", () => {
  assert.ok(CART_REVIEW_TOOLS.some((tool) => tool.id === "contingency"));
  const review = analyzeCartReview(splitScenario(), "contingency");
  assert.deepEqual(review.columns, ["Merchant withdrawn", "Offers removed", "Baseline units", "Contingency units", "Lost units", "Newly feasible units", "Landed cost delta"]);
  assert.equal(review.rows.length, 2);
  assert.match(review.note, /identical demand/);
  const packet = createCartReviewPacket(splitScenario(), "contingency");
  assert.deepEqual(replayCartReviewPacket(packet).review.rows, review.rows);
  const empty = analyzeCartReview(clonePreset("neighbourhood"), "contingency");
  assert.ok(empty.rows.length >= 0);
});

test("CLI contingency evaluates one experiment with merchant aggregates", () => {
  const run = (args, value) => spawnSync(process.execPath, [cli, ...args], { input: JSON.stringify(value), encoding: "utf8", timeout: 10000 });
  const result = JSON.parse(run(["contingency", "--input", "-", "--experiment", JSON.stringify({ type: "withdraw", offerId: "O1" })], splitScenario()).stdout);
  assert.equal(result.contingency.baseline.fulfilledUnits, 15);
  assert.equal(result.contingency.lostUnits, 5);
  assert.equal(result.merchant.fulfilledUnitsDelta, -5);
  assert.equal(JSON.stringify(result.merchant).includes("B1"), false);
  const missing = run(["contingency", "--input", "-"], splitScenario());
  assert.notEqual(missing.status, 0);
  const badJson = run(["contingency", "--input", "-", "--experiment", "{nope"], splitScenario());
  assert.notEqual(badJson.status, 0);
  const badExperiment = run(["contingency", "--input", "-", "--experiment", JSON.stringify({ type: "withdraw", offerId: "OX" })], splitScenario());
  assert.notEqual(badExperiment.status, 0);
});
