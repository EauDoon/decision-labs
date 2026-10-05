import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  clonePreset, validateScenario, planMultiMerchant, planContingency, createMerchantPlanReport,
  multiMerchantPlanCsv, offerBuyerCompatibility, analyzeCartReview, CART_REVIEW_TOOLS,
  createCartReviewPacket, replayCartReviewPacket, evaluateMarket, MAX_PLAN_NODES,
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

function bruteForcePlan(scenario) {
  const buyers = [...scenario.buyers].sort((a, b) => (a.id < b.id ? -1 : 1));
  const offers = [...scenario.offers].sort((a, b) => (a.id < b.id ? -1 : 1));
  const compat = new Map(buyers.map((buyer) => [buyer.id,
    offers.filter((offer) => offerBuyerCompatibility(scenario, offer.id).find((entry) => entry.buyerId === buyer.id).reasons.length === 0).map((offer) => offer.id)]));
  const priceFor = (offer, units) => {
    let price = offer.unitPrice;
    for (const tier of offer.tiers ?? []) if (units >= tier.minimumUnits) price = tier.unitPrice;
    return price;
  };
  const shipFor = (offer) => (offer.fulfillment === "pickup" ? 0 : offer.shippingPerBuyer);
  let best = null;
  const assignment = new Array(buyers.length).fill(null);
  const visit = (index) => {
    if (index === buyers.length) {
      const perOffer = new Map();
      buyers.forEach((buyer, i) => {
        if (!assignment[i]) return;
        if (!perOffer.has(assignment[i])) perOffer.set(assignment[i], []);
        perOffer.get(assignment[i]).push(buyer);
      });
      let fulfilled = 0;
      let cost = 0;
      const active = [];
      // Released buyers stay released for this leaf only; the shared
      // assignment array is never mutated so sibling leaves stay intact.
      const released = new Set();
      for (const [offerId, members] of perOffer) {
        const offer = offers.find((o) => o.id === offerId);
        const units = members.reduce((sum, b) => sum + b.quantity, 0);
        if (units < offer.minimumUnits || units > offer.capacity) {
          for (const member of members) released.add(member.id);
          continue;
        }
        const price = priceFor(offer, units);
        const total = units * price + members.length * shipFor(offer);
        fulfilled += units;
        cost += total;
        active.push({ offerId, buyerIds: members.map((b) => b.id).sort(), units, price, total });
      }
      assert.equal(released.size + active.flatMap((entry) => entry.buyerIds).length + buyers.filter((b, i) => !assignment[i]).length, buyers.length);
      active.sort((a, b) => (a.offerId < b.offerId ? -1 : 1));
      const key = JSON.stringify(active);
      if (!best || fulfilled > best.fulfilled || (fulfilled === best.fulfilled && (cost < best.cost || (cost === best.cost && (active.length < best.active.length || (active.length === best.active.length && key < best.key)))))) {
        best = { fulfilled, cost, active, key };
      }
      return;
    }
    for (const offerId of [...compat.get(buyers[index].id), null]) {
      assignment[index] = offerId;
      visit(index + 1);
    }
  };
  visit(0);
  return best;
}

test("plan agrees with an independent brute-force reference on fixed rooms", () => {
  for (const scenario of [splitScenario(), clonePreset("neighbourhood")]) {
    const plan = planMultiMerchant(scenario);
    const reference = bruteForcePlan(scenario);
    assert.equal(plan.status, "optimal");
    assert.equal(plan.fulfilledUnits, reference.fulfilled);
    assert.equal(plan.totalCost, reference.cost);
    assert.deepEqual(plan.assignments.map((a) => [a.offerId, a.buyerIds, a.units, a.unitPrice]),
      reference.active.map((a) => [a.offerId, a.buyerIds, a.units, a.price]));
  }
});

test("multi-merchant plan can beat the single-offer winner on identical demand", () => {
  const scenario = splitScenario();
  const market = evaluateMarket(scenario);
  const plan = planMultiMerchant(scenario);
  assert.equal(market.winner.fulfilledUnits, 10);
  assert.equal(plan.fulfilledUnits, 15);
  assert.equal(plan.unservedUnits, 0);
});

test("assignments never duplicate buyers and conserve demand", () => {
  const scenario = splitScenario();
  const plan = planMultiMerchant(scenario);
  const assignedIds = plan.assignments.flatMap((entry) => entry.buyerIds);
  assert.equal(new Set(assignedIds).size, assignedIds.length);
  const assignedUnits = plan.assignments.reduce((sum, entry) => sum + entry.units, 0);
  const requested = scenario.buyers.reduce((sum, buyer) => sum + buyer.quantity, 0);
  assert.equal(assignedUnits + plan.unservedUnits, requested);
  assert.equal(plan.fulfilledUnits + plan.unservedUnits, requested);
  for (const entry of plan.assignments) {
    const offer = scenario.offers.find((item) => item.id === entry.offerId);
    assert.ok(entry.units >= offer.minimumUnits);
    assert.ok(entry.units <= offer.capacity);
    assert.equal(entry.totalCost, entry.itemsCost + entry.shippingCost);
    assert.equal(entry.itemsCost, entry.units * entry.unitPrice);
  }
});

test("tier prices reprice from actual assigned units", () => {
  const scenario = validateScenario({
    title: "Tier test", currency: "USD",
    buyers: [
      { id: "B1", label: "One", category: "Beans", quantity: 6, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Whole"] },
      { id: "B2", label: "Two", category: "Beans", quantity: 6, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Whole"] },
    ],
    offers: [
      { id: "O1", merchant: "Alpha", category: "Beans", variant: "Whole", unitPrice: 20, minimumUnits: 1, deliveryDays: 5, capacity: 12, shippingPerBuyer: 0, fulfillment: "pickup", tiers: [{ minimumUnits: 10, unitPrice: 15 }] },
    ],
  });
  const plan = planMultiMerchant(scenario);
  assert.equal(plan.fulfilledUnits, 12);
  assert.equal(plan.assignments[0].unitPrice, 15);
  assert.equal(plan.totalCost, 180);
});

function tierOnlyScenario() {
  const scenario = splitScenario();
  scenario.buyers = scenario.buyers.slice(0, 2).map(buyer => ({ ...buyer, quantity: 6, maxUnitPrice: 15 }));
  scenario.offers = [{ ...scenario.offers[0], capacity: 12, shippingPerBuyer: 0, tiers: [{ minimumUnits: 10, unitPrice: 15 }] }];
  return validateScenario(scenario);
}

test("planner admits buyers who jointly unlock their price ceiling, including CLI and contingency callers", () => {
  const scenario = tierOnlyScenario();
  const before = structuredClone(scenario);
  const winner = evaluateMarket(scenario).winner;
  assert.equal(winner.fulfilledUnits, 12);
  assert.equal(winner.totalCost, 180);
  // Keep the public helper's base-price semantics unchanged.
  assert.deepEqual(offerBuyerCompatibility(scenario, "O1").map(entry => entry.reasons), [["price"], ["price"]]);
  const plan = planMultiMerchant(scenario);
  assert.equal(plan.status, "optimal");
  assert.equal(plan.fulfilledUnits, 12);
  assert.equal(plan.totalCost, 180);
  assert.deepEqual(plan.assignments[0].buyerIds, ["B1", "B2"]);
  assert.deepEqual(scenario, before);
  const result = spawnSync(process.execPath, [cli, "plan", "--input", "-"], {
    input: JSON.stringify(scenario), encoding: "utf8", timeout: 10000
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).plan.fulfilledUnits, 12);
  const contingency = planContingency(scenario, { type: "capacity", offerId: "O1", capacity: 10 });
  assert.equal(contingency.baseline.fulfilledUnits, 12);
  assert.equal(contingency.fulfilledUnitsDelta, -12);
});

test("tier-only landed budgets include charged shipping and preserve pickup semantics", () => {
  for (const [fulfillment, shipping, budget, expectedUnits, expectedCost] of [
    ["shipping", 5, 95, 12, 190],
    ["shipping", 5.01, 95, 0, 0],
    ["pickup", 999, 90, 12, 180]
  ]) {
    const scenario = tierOnlyScenario();
    scenario.buyers.forEach(buyer => { buyer.maxUnitPrice = 30; buyer.maxOrderTotal = budget; });
    Object.assign(scenario.offers[0], { fulfillment, shippingPerBuyer: shipping });
    const plan = planMultiMerchant(scenario);
    assert.equal(plan.fulfilledUnits, expectedUnits);
    assert.equal(plan.totalCost, expectedCost);
    assert.equal(plan.status, "optimal");
  }
});

test("unreached tiers cannot justify an allocation and valid smaller cohorts remain available", () => {
  const scenario = tierOnlyScenario();
  scenario.buyers.forEach(buyer => { buyer.quantity = 5; buyer.maxUnitPrice = 17; });
  scenario.offers[0].tiers = [{ minimumUnits: 10, unitPrice: 18 }, { minimumUnits: 12, unitPrice: 15 }];
  assert.equal(planMultiMerchant(scenario).fulfilledUnits, 0);
  for (const useBudget of [false, true]) {
    const partial = tierOnlyScenario();
    partial.offers[0].capacity = 10;
    partial.buyers[1].maxUnitPrice = 30;
    if (useBudget) {
      partial.buyers.forEach((buyer, index) => { buyer.maxUnitPrice = 30; buyer.maxOrderTotal = index === 0 ? 90 : 120; });
    }
    const plan = planMultiMerchant(partial);
    assert.equal(plan.fulfilledUnits, 6);
    assert.equal(plan.unservedUnits, 6);
    assert.equal(plan.totalCost, 120);
    assert.deepEqual(plan.assignments[0].buyerIds, ["B2"]);
    assert.equal(plan.assignments[0].unitPrice, 20);
  }
});

test("tier-eligible whole orders can combine with another merchant without splitting buyers", () => {
  const scenario = tierOnlyScenario();
  scenario.buyers.push({ ...scenario.buyers[0], id: "B3", label: "Three", quantity: 5 });
  scenario.offers.push({ ...scenario.offers[0], id: "O2", merchant: "Beta", unitPrice: 14, capacity: 5, tiers: [] });
  const plan = planMultiMerchant(scenario);
  assert.equal(plan.status, "optimal");
  assert.equal(plan.fulfilledUnits, 17);
  assert.equal(plan.totalCost, 250);
  assert.equal(plan.unservedUnits, 0);
  assert.deepEqual(plan.assignments.map(entry => [entry.offerId, entry.buyerIds, entry.units, entry.unitPrice]), [
    ["O1", ["B1", "B2"], 12, 15], ["O2", ["B3"], 5, 14]
  ]);
});

for (const tiered of [false, true]) {
  test(`zero ${tiered ? "tier" : "base"} prices still minimize merchants and break exact ties deterministically`, () => {
    const scenario = tierOnlyScenario();
    scenario.buyers = Array.from({ length: 4 }, (_, index) => ({
      ...scenario.buyers[0], id: `B${index + 1}`, quantity: 1, maxUnitPrice: 0
    }));
    const offer = { ...scenario.offers[0], unitPrice: tiered ? 1 : 0, capacity: 4,
      fulfillment: "pickup", tiers: tiered ? [{ minimumUnits: 2, unitPrice: 0 }] : [] };
    scenario.offers = [offer, { ...offer, id: "O2", merchant: "Beta" }];
    for (const reverse of [false, true]) {
      if (reverse) { scenario.buyers.reverse(); scenario.offers.reverse(); }
      const tied = planMultiMerchant(scenario);
      assert.equal(tied.fulfilledUnits, 4);
      assert.equal(tied.totalCost, 0);
      assert.deepEqual(tied.assignments.map(entry => entry.offerId), ["O1"]);
    }
    scenario.offers.find(entry => entry.id === "O1").capacity = 2;
    const plan = planMultiMerchant(scenario);
    assert.equal(plan.status, "optimal");
    assert.equal(plan.fulfilledUnits, 4);
    assert.equal(plan.totalCost, 0);
    assert.equal(plan.merchantCount, 1);
    assert.deepEqual(plan.assignments.map(entry => entry.offerId), ["O2"]);
  });
}

test("minimum orders release sub-minimum assignments instead of splitting buyers", () => {
  const scenario = validateScenario({
    title: "Minimum test", currency: "USD",
    buyers: [
      { id: "B1", label: "One", category: "Beans", quantity: 5, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Whole"] },
      { id: "B2", label: "Two", category: "Beans", quantity: 5, maxUnitPrice: 30, latestDeliveryDays: 7, allowedVariants: ["Whole"] },
    ],
    offers: [
      { id: "O1", merchant: "Alpha", category: "Beans", variant: "Whole", unitPrice: 20, minimumUnits: 8, deliveryDays: 5, capacity: 10, shippingPerBuyer: 0, fulfillment: "pickup" },
    ],
  });
  const plan = planMultiMerchant(scenario);
  assert.equal(plan.fulfilledUnits, 10);
  assert.equal(plan.assignments.length, 1);
});

test("rooms above the node bound return an honest limit outcome", () => {
  const scenario = splitScenario();
  const limited = planMultiMerchant(scenario, { nodeBudget: 1 });
  assert.equal(limited.status, "too_large");
  assert.equal(limited.optimal, false);
  assert.ok(limited.evaluatedNodes >= 1);
  assert.throws(() => planMultiMerchant(scenario, { nodeBudget: 0 }), /node budget/);
  assert.throws(() => planMultiMerchant(scenario, { nodeBudget: MAX_PLAN_NODES + 1 }), /node budget/);
  assert.throws(() => planMultiMerchant(scenario, []), /options must be an object/);
});

test("unserved buyers explain whether any compatible offer exists", () => {
  const plan = planMultiMerchant(clonePreset("neighbourhood"));
  assert.ok(plan.unserved.length > 0);
  for (const entry of plan.unserved) {
    assert.match(entry.note, /No compatible offer|capacity or minimum/);
  }
});

test("merchant plan summary carries aggregates only, never buyer records", () => {
  const scenario = splitScenario();
  const plan = planMultiMerchant(scenario);
  const summary = createMerchantPlanReport(plan, scenario);
  const text = JSON.stringify(summary);
  assert.doesNotMatch(text, /B1|B2|B3/);
  assert.doesNotMatch(text, /One|Two|Three/);
  assert.doesNotMatch(text, /buyerIds|allocations/);
  assert.equal(summary.merchants.length, 2);
  assert.equal(summary.fulfilledUnits, 15);
  assert.equal(summary.totalCost, 320);
  assert.match(summary.note, /Aggregate projections only/);
  assert.throws(() => createMerchantPlanReport(null, scenario), /plan is required/);
});

test("multimerchant review tool tabulates assignments and unserved demand", () => {
  assert.ok(CART_REVIEW_TOOLS.some((tool) => tool.id === "multimerchant"));
  const review = analyzeCartReview(splitScenario(), "multimerchant");
  assert.deepEqual(review.columns, ["Merchant", "Offer", "Buyers", "Units", "Unit price", "Shipping", "Order total"]);
  assert.ok(review.rows.some((row) => row[0] === "Unserved demand"));
  assert.match(review.note, /Bounded exact plan/);
  const packet = createCartReviewPacket(splitScenario(), "multimerchant");
  assert.deepEqual(replayCartReviewPacket(packet).review.rows, review.rows);
});

test("organizer plan CSV labels buyers; merchant summary stays aggregate", () => {
  const csv = multiMerchantPlanCsv(splitScenario());
  assert.match(csv, /^"Private buyer label","Buyer","Merchant","Offer"/);
  assert.match(csv, /"One","B1","Alpha","O1"/);
  const summary = JSON.stringify(createMerchantPlanReport(planMultiMerchant(splitScenario()), splitScenario()));
  for (const label of ["One", "Two", "Three", "B1", "B2", "B3"]) {
    assert.equal(summary.includes(`"${label}"`), false);
  }
});

test("CLI plan returns the plan and merchant aggregates together", () => {
  const run = (args, value) => spawnSync(process.execPath, [cli, ...args], { input: JSON.stringify(value), encoding: "utf8", timeout: 10000 });
  const result = JSON.parse(run(["plan", "--input", "-"], splitScenario()).stdout);
  assert.equal(result.plan.status, "optimal");
  assert.equal(result.plan.fulfilledUnits, 15);
  assert.equal(result.merchant.fulfilledUnits, 15);
  assert.equal(result.merchant.merchants.length, 2);
  const bad = run(["plan", "--input", "-"], { nope: true });
  assert.notEqual(bad.status, 0);
});
