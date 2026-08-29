import test from "node:test";
import assert from "node:assert/strict";
import {
  ScenarioError,
  aggregateDemand,
  clonePreset,
  decodeScenario,
  encodeScenario,
  evaluateMarket,
  evaluateOffer,
  validateScenario
} from "../src/model.js";

test("the neighbourhood preset produces a qualified winner", () => {
  const market = evaluateMarket(clonePreset("neighbourhood"));
  assert.equal(market.winner?.offer.id, "O01");
  assert.equal(market.winner?.fulfilledUnits, 12);
  assert.equal(market.winner?.deliveredBuyers, 4);
  assert.ok(market.winner?.savings > 0);
});

test("buyer compatibility requires category, variant, price, and delivery", () => {
  const scenario = clonePreset("neighbourhood");
  const result = evaluateOffer(scenario, "O02");
  assert.deepEqual(result.selectedBuyerIds, ["B01", "B03"]);
  assert.equal(result.compatibleBuyerCount, 2);
  assert.equal(result.qualifies, true);
  assert.equal(result.fulfilledUnits, 6);
  assert.equal(result.unitsShort, 0);
});

test("offer outcomes explain every included and excluded buyer", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers = [
    { ...scenario.buyers[0], id: "included", quantity: 2 },
    { ...scenario.buyers[0], id: "capacity", quantity: 4 },
    { ...scenario.buyers[0], id: "mismatch", category: "Tea", allowedVariants: ["Dark"], maxUnitPrice: 1, latestDeliveryDays: 1 }
  ];
  scenario.offers[0] = { ...scenario.offers[0], minimumUnits: 2, capacity: 3 };
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.deepEqual(result.buyerOutcomes, [
    { buyerId: "included", status: "included", reasons: [] },
    { buyerId: "capacity", status: "capacity", reasons: ["capacity"] },
    { buyerId: "mismatch", status: "incompatible", reasons: ["category", "variant", "price", "delivery"] }
  ]);
});

test("compatible buyers explain when an offer remains below minimum", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.offers[0].minimumUnits = 100;
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(result.qualifies, false);
  assert.equal(result.buyerOutcomes.filter(({ status }) => status === "minimum").length, result.compatibleBuyerCount);
});

test("capacity never splits a buyer quantity", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.offers[0].capacity = 4;
  scenario.offers[0].minimumUnits = 2;
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(result.fulfilledUnits, 4);
  assert.equal(result.deliveredBuyers, 1);
});

test("whole-buyer allocation finds the maximum feasible cohort", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers = [
    { ...scenario.buyers[0], id: "B01", quantity: 6 },
    { ...scenario.buyers[0], id: "B02", quantity: 10 }
  ];
  scenario.offers = [{ ...scenario.offers[0], minimumUnits: 10, capacity: 10 }];
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(result.qualifies, true);
  assert.equal(result.fulfilledUnits, 10);
  assert.deepEqual(result.selectedBuyerIds, ["B02"]);
});

test("an unqualified offer reports no transaction or savings", () => {
  const scenario = clonePreset("studio");
  scenario.offers[0].minimumUnits = 100;
  const result = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(result.qualifies, false);
  assert.equal(result.totalCost, 0);
  assert.equal(result.savings, 0);
  assert.equal(result.selectedBuyerIds.length, 0);
});

test("market ranking is deterministic on ties", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.offers = [
    { ...scenario.offers[0], id: "O02" },
    { ...scenario.offers[0], id: "O01" }
  ];
  const market = evaluateMarket(scenario);
  assert.deepEqual(market.ranked.map(({ offer }) => offer.id), ["O01", "O02"]);
});

test("text matching and id ordering do not depend on the host locale", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers = [{ ...scenario.buyers[0], id: "B", category: "I", allowedVariants: ["STANDARD"] }];
  scenario.offers = [
    { ...scenario.offers[0], id: "z", category: "i", variant: "standard", minimumUnits: 1 },
    { ...scenario.offers[0], id: "a", category: "i", variant: "standard", minimumUnits: 1 }
  ];
  const market = evaluateMarket(scenario);
  assert.equal(market.results.every((result) => result.qualifies), true);
  assert.deepEqual(market.ranked.map((result) => result.offer.id), ["a", "z"]);
});

test("market summary counts categories with matching semantics", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].category = "COFFEE BEANS";
  assert.equal(evaluateMarket(scenario).categoryCount, 1);
});

test("aggregate demand exposes ranges, not buyer records", () => {
  const groups = aggregateDemand(clonePreset("studio"));
  assert.equal(groups[0].buyerCount, 4);
  assert.equal(groups[0].units, 18);
  assert.equal(groups[0].priceFloor, 250);
  assert.equal(groups[0].priceCeiling, 310);
  assert.equal("label" in groups[0], false);
});

test("aggregate demand deduplicates variant casing", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers = [
    { ...scenario.buyers[0], allowedVariants: ["Medium roast"] },
    { ...scenario.buyers[1], allowedVariants: ["medium ROAST"] }
  ];
  assert.equal(evaluateOffer(scenario, "O01").compatibleBuyerCount, 2);
  assert.deepEqual(aggregateDemand(scenario)[0].variants, ["Medium roast"]);
});

test("validation rejects duplicate ids and invalid currency", () => {
  const duplicate = clonePreset("neighbourhood");
  duplicate.buyers[1].id = duplicate.buyers[0].id;
  assert.throws(() => validateScenario(duplicate), ScenarioError);
  const currency = clonePreset("neighbourhood");
  currency.currency = "A$";
  assert.throws(() => validateScenario(currency), /three-letter code/);
});

test("validation returns a detached normalized scenario", () => {
  const input = clonePreset("pantry");
  const output = validateScenario(input);
  output.buyers[0].allowedVariants.push("Changed");
  assert.equal(input.buyers[0].allowedVariants.includes("Changed"), false);
});

test("share encoding round trips normal cases and rejects oversized links", () => {
  const normal = clonePreset("neighbourhood");
  assert.deepEqual(decodeScenario(encodeScenario(normal)), validateScenario(normal));

  const large = clonePreset("neighbourhood");
  const variants = Array.from({ length: 12 }, (_, index) => `variant-${index}-${"x".repeat(48)}`);
  large.title = "x".repeat(80);
  large.buyers = Array.from({ length: 40 }, (_, index) => ({
    ...large.buyers[0],
    id: `B${index}`,
    label: `buyer-${index}-${"x".repeat(45)}`,
    category: `category-${"x".repeat(50)}`,
    allowedVariants: variants
  }));
  large.offers = Array.from({ length: 40 }, (_, index) => ({
    ...large.offers[0],
    id: `O${index}`,
    merchant: `merchant-${index}-${"x".repeat(42)}`,
    category: `category-${"x".repeat(50)}`,
    variant: variants[index % variants.length]
  }));
  assert.throws(() => encodeScenario(large), /too large/);
});
