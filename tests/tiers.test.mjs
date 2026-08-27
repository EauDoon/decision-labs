import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, validateScenario, evaluateOffer, evaluateMarket, aggregateDemand, encodeScenario, decodeScenario } from "../src/model.js";

function room(quantities, overrides = {}) {
  const source = clonePreset("tiers");
  return {
    ...source,
    buyers: quantities.map((quantity, index) => ({ ...source.buyers[0], id: `B${index}`, label: `Synthetic buyer ${index}`, quantity, maxUnitPrice: 30 })),
    offers: [{ ...source.offers[0], minimumUnits: 1, capacity: 20, unitPrice: 30, tiers: [{ minimumUnits: 10, unitPrice: 20 }], ...overrides }]
  };
}

test("the price ladder allocates whole buyers and prices all units at the selected tier", () => {
  const result = evaluateMarket(clonePreset("tiers")).winner;
  assert.equal(result.offer.id, "O01");
  assert.equal(result.activeTierIndex, 2);
  assert.equal(result.fulfilledUnits, 20);
  assert.equal(result.effectiveUnitPrice, 20);
  assert.equal(result.totalCost, 409);
  assert.equal(result.basePriceDiscount, 160);
  assert.deepEqual(result.selectedBuyerIds, ["B01", "B03", "B04"]);
  assert.deepEqual(result.tierProgress.map(({ allocatedUnits }) => allocatedUnits), [6, 15, 20]);
});

test("discount-only buyers can jointly qualify without first affording the base price", () => {
  const scenario = room([5, 5]);
  scenario.buyers.forEach((buyer) => { buyer.maxUnitPrice = 20; });
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(result.fulfilledUnits, 10);
  assert.equal(result.effectiveUnitPrice, 20);
  assert.equal(result.tierProgress[0].allocatedUnits, 0);
});

test("interested demand cannot unlock a tier when whole orders cannot meet its minimum", () => {
  const scenario = room([6, 6], { capacity: 10 });
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(result.fulfilledUnits, 6);
  assert.equal(result.effectiveUnitPrice, 30);
  assert.equal(result.tierProgress[1].compatibleUnits, 12);
  assert.equal(result.tierProgress[1].allocatedUnits, 6);
  assert.equal(result.tierProgress[1].unitsShort, 4);
  assert.equal(result.basePriceDiscount, 0);
});

test("a discount that cannot qualify does not make buyers eligible at the base price", () => {
  const scenario = room([6, 6], { capacity: 10 });
  scenario.buyers.forEach((buyer) => { buyer.maxUnitPrice = 20; });
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(result.qualifies, false);
  assert.equal(result.fulfilledUnits, 0);
  assert.equal(result.effectiveUnitPrice, null);
  assert.equal(result.activeTierIndex, null);
  assert.equal(result.totalCost, 0);
  assert.equal(result.basePriceDiscount, 0);
  assert.deepEqual(result.allocations, []);
});

test("the exact threshold belongs to the cheaper tier and the prior band stops below it", () => {
  const scenario = room([4, 6, 9], { capacity: 10 });
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(result.fulfilledUnits, 10);
  assert.deepEqual(result.selectedBuyerIds, ["B0", "B1"]);
  assert.equal(result.tierProgress[0].maximumUnits, 9);
  assert.equal(result.tierProgress[0].allocatedUnits, 9);
  assert.equal(result.tierProgress[1].minimumUnits, 10);
});

test("tier capacity allocation retains stable ID tie-breaking after input reordering", () => {
  const scenario = room([5, 5, 5], { capacity: 10 });
  const first = evaluateOffer(scenario, scenario.offers[0]);
  scenario.buyers.reverse();
  const second = evaluateOffer(scenario, scenario.offers[0]);
  assert.deepEqual(first.selectedBuyerIds, second.selectedBuyerIds);
  assert.deepEqual(first.selectedBuyerIds, ["B0", "B1"]);
});

test("a cheap tier still enforces category, variant, and delivery constraints", () => {
  const scenario = room([6, 4, 4, 4]);
  scenario.buyers[1].category = "Tea";
  scenario.buyers[2].allowedVariants = ["Decaf"];
  scenario.buyers[3].latestDeliveryDays = 0;
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(result.fulfilledUnits, 6);
  assert.equal(result.effectiveUnitPrice, 30);
  assert.equal(result.tierProgress[1].compatibleUnits, 6);
});

test("landed costs reconcile, shipping above the item ceiling is explicit, and privacy aggregates stay separate", () => {
  const scenario = room([10], { shippingPerBuyer: 5 });
  scenario.buyers[0].maxUnitPrice = 20;
  scenario.buyers[0].label = "Local-only synthetic label";
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.deepEqual(result.allocations[0], {
    buyerId: "B0", quantity: 10, unitPrice: 20, itemsCost: 200,
    shippingCost: 5, totalCost: 205, landedUnitCost: 20.5,
    ceilingTotal: 200, headroom: -5, exceedsCeilingAfterShipping: true
  });
  assert.equal(result.savings, 0);
  assert.equal(result.allocations.reduce((sum, entry) => sum + entry.totalCost, 0), result.totalCost);
  assert.equal(JSON.stringify(aggregateDemand(scenario)).includes(scenario.buyers[0].label), false);
  assert.equal(JSON.stringify(result.tierProgress).includes("buyerId"), false);
});

test("legacy scenarios and empty tiers keep the same allocation and costs", () => {
  for (const name of ["neighbourhood", "studio", "pantry"]) {
    const original = clonePreset(name);
    const legacy = evaluateMarket(original);
    const extended = structuredClone(original);
    extended.offers.forEach((entry) => { entry.tiers = []; });
    const next = evaluateMarket(extended);
    for (let index = 0; index < legacy.results.length; index += 1) {
      for (const field of ["selectedBuyerIds", "buyerOutcomes", "fulfilledUnits", "totalCost", "savings", "unitsShort", "qualifies"]) {
        assert.deepEqual(next.results[index][field], legacy.results[index][field]);
      }
    }
    assert.equal(next.winner?.offer.id, legacy.winner?.offer.id);
    assert.deepEqual(decodeScenario(encodeScenario(original)), validateScenario(original));
  }
});

test("tier JSON and share links round trip without aliasing the input", () => {
  const scenario = clonePreset("tiers");
  assert.deepEqual(decodeScenario(encodeScenario(scenario)), validateScenario(scenario));
  const normalized = validateScenario(scenario);
  normalized.offers[0].tiers[0].unitPrice = 1;
  assert.equal(scenario.offers[0].tiers[0].unitPrice, 24);
});

test("malformed, unordered, duplicate, upward, and over-capacity tiers are rejected", () => {
  const invalid = [
    null, {}, [null], [[10, 20]], [{ minimumUnits: 10, unitPrice: 30 }],
    [{ minimumUnits: 0, unitPrice: 20 }], [{ minimumUnits: 1, unitPrice: 20 }],
    [{ minimumUnits: 21, unitPrice: 20 }], [{ minimumUnits: 10.5, unitPrice: 20 }],
    [{ minimumUnits: 10, unitPrice: -1 }], [{ minimumUnits: 10, unitPrice: Infinity }],
    [{ minimumUnits: 10, unitPrice: 20 }, { minimumUnits: 10, unitPrice: 10 }],
    [{ minimumUnits: 15, unitPrice: 20 }, { minimumUnits: 10, unitPrice: 10 }],
    [{ minimumUnits: 10, unitPrice: 20 }, { minimumUnits: 15, unitPrice: 21 }],
    Array.from({ length: 9 }, (_, i) => ({ minimumUnits: i + 2, unitPrice: 29 - i }))
  ];
  for (const tiers of invalid) assert.throws(() => validateScenario(room([10], { tiers })));
});

test("ambiguous numeric values are rejected rather than silently becoming zero", () => {
  for (const value of [null, true, false, [], {}, "", " "]) {
    const scenario = room([10]);
    scenario.offers[0].tiers[0].unitPrice = value;
    assert.throws(() => validateScenario(scenario));
  }
  const scenario = room([10]);
  scenario.offers[0].tiers[0] = { minimumUnits: "10", unitPrice: "20" };
  assert.equal(validateScenario(scenario).offers[0].tiers[0].unitPrice, 20);
});

test("zero-cost tier and upper quantity bound behave without division errors", () => {
  const scenario = room([5000], { capacity: 5000, shippingPerBuyer: 0, tiers: [{ minimumUnits: 5000, unitPrice: 0 }] });
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(result.fulfilledUnits, 5000);
  assert.equal(result.totalCost, 0);
  assert.equal(result.averageLandedUnitCost, 0);
  scenario.buyers[0].quantity = 5001;
  assert.throws(() => validateScenario(scenario));
});

test("tiered allocation agrees with exhaustive subset search across 120 deterministic scenarios", () => {
  for (let seed = 1; seed <= 120; seed += 1) {
    const scenario = room(Array.from({ length: 6 }, (_, i) => 1 + ((seed * (i + 3) + i * i) % 9)), {
      capacity: 12 + seed % 9,
      tiers: [{ minimumUnits: 6, unitPrice: 25 }, { minimumUnits: 12, unitPrice: 20 }]
    });
    scenario.buyers.forEach((buyer, i) => { buyer.maxUnitPrice = [19, 20, 24, 25, 30][(seed + i) % 5]; });
    let bestUnits = 0;
    const offer = scenario.offers[0];
    for (let mask = 1; mask < 2 ** scenario.buyers.length; mask += 1) {
      const selected = scenario.buyers.filter((_, i) => mask & (1 << i));
      const units = selected.reduce((sum, entry) => sum + entry.quantity, 0);
      if (units > offer.capacity || units < offer.minimumUnits) continue;
      const price = [...offer.tiers].reverse().find((tier) => units >= tier.minimumUnits)?.unitPrice ?? offer.unitPrice;
      if (selected.every((entry) => entry.maxUnitPrice >= price)) bestUnits = Math.max(bestUnits, units);
    }
    const result = evaluateOffer(scenario, offer);
    assert.equal(result.fulfilledUnits, bestUnits, `seed ${seed}`);
    if (result.qualifies) {
      const price = [...offer.tiers].reverse().find((tier) => result.fulfilledUnits >= tier.minimumUnits)?.unitPrice ?? offer.unitPrice;
      assert.equal(result.effectiveUnitPrice, price);
      assert.equal(result.allocations.reduce((sum, entry) => sum + entry.quantity, 0), bestUnits);
      assert.ok(result.allocations.every((entry) => entry.unitPrice <= scenario.buyers.find((buyer) => buyer.id === entry.buyerId).maxUnitPrice));
    }
  }
});
