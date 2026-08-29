import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("canonically equivalent Unicode text shares matching and grouping semantics", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers = [
    { ...scenario.buyers[0], id: "B1", category: "Caf\u00e9", allowedVariants: ["Cr\u00e8me"] },
    { ...scenario.buyers[0], id: "B2", category: "Cafe\u0301", allowedVariants: ["Cre\u0300me"] }
  ];
  scenario.offers = [{ ...scenario.offers[0], category: "Cafe\u0301", variant: "Cre\u0300me", minimumUnits: 1 }];
  assert.equal(evaluateOffer(scenario, scenario.offers[0]).compatibleBuyerCount, 2);
  assert.equal(evaluateMarket(scenario).categoryCount, 1);
  const demand = aggregateDemand(scenario)[0];
  assert.equal(demand.category, "Caf\u00e9");
  assert.deepEqual(demand.variants, ["Cr\u00e8me"]);
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
  assert.throws(() => validateScenario(currency), /three-letter ASCII code/);
  currency.currency = "ſgd";
  assert.throws(() => validateScenario(currency), /three-letter ASCII code/);
});

test("validation rejects non-objects, empty collections, and unknown identifiers", () => {
  assert.throws(() => validateScenario(null), /must be an object/);
  assert.throws(() => validateScenario([]), /must be an object/);
  const emptyBuyers = clonePreset("neighbourhood");
  emptyBuyers.buyers = [];
  assert.throws(() => validateScenario(emptyBuyers), /Buyers must contain 1 to 40 entries/);
  const emptyOffers = clonePreset("neighbourhood");
  emptyOffers.offers = [];
  assert.throws(() => validateScenario(emptyOffers), /Offers must contain 1 to 40 entries/);
  const tooMany = clonePreset("neighbourhood");
  tooMany.buyers = Array.from({ length: 41 }, (_, index) => ({ ...tooMany.buyers[0], id: `B${index}` }));
  assert.throws(() => validateScenario(tooMany), /Buyers must contain 1 to 40 entries/);
  assert.throws(() => clonePreset("missing"), /Unknown preset/);
  assert.throws(() => evaluateOffer(clonePreset("neighbourhood"), "missing-offer"), /Offer was not found/);
  assert.throws(() => decodeScenario(null), /must be a string/);
  assert.throws(() => decodeScenario(""), /empty or too large/);
});

test("empty fields name the missing input instead of a JSON path", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.title = "   ";
  assert.throws(() => validateScenario(scenario), /Room name cannot be empty/);
  scenario.title = "Neighbourhood coffee run";
  scenario.currency = "";
  assert.throws(() => validateScenario(scenario), /Currency cannot be empty/);
  scenario.currency = "AUD";
  scenario.buyers[0].label = " \t";
  assert.throws(() => validateScenario(scenario), /Buyer 1 private label cannot be empty/);
  scenario.buyers[0].label = "North block";
  scenario.buyers[0].quantity = "";
  assert.throws(() => validateScenario(scenario), /Buyer 1 quantity cannot be empty/);
  scenario.buyers[0].quantity = 2;
  scenario.buyers[0].allowedVariants = [];
  assert.throws(() => validateScenario(scenario), /Buyer 1 accepted variants must contain 1 to 12 names/);
  scenario.buyers[0].allowedVariants = ["Medium roast"];
  scenario.offers[0].merchant = "";
  assert.throws(() => validateScenario(scenario), /Offer 1 merchant cannot be empty/);
  scenario.offers[0].merchant = "Harbour Roasters";
  scenario.offers[0].unitPrice = " ";
  assert.throws(() => validateScenario(scenario), /Offer 1 unit price cannot be empty/);
  scenario.offers[0].unitPrice = 26;
  scenario.offers[0].tiers = [{ minimumUnits: "", unitPrice: 20 }];
  assert.throws(() => validateScenario(scenario), /Offer 1 tier 1 minimum units cannot be empty/);
  try {
    validateScenario({ ...clonePreset("neighbourhood"), buyers: [{ ...clonePreset("neighbourhood").buyers[0], label: "" }] });
    assert.fail("expected empty label to fail");
  } catch (error) {
    assert.match(error.message, /Buyer 1 private label cannot be empty/);
    assert.doesNotMatch(error.message, /buyers\[\d+\]/);
  }
});

test("numeric fields reject exponential notation and plus prefixes", () => {
  for (const value of ["1e2", "1E-1", "+10", "1e+2", "NaN", "Infinity"]) {
    const quantity = clonePreset("neighbourhood");
    quantity.buyers[0].quantity = value;
    assert.throws(() => validateScenario(quantity), /must be a number/);
    const price = clonePreset("neighbourhood");
    price.offers[0].unitPrice = value;
    assert.throws(() => validateScenario(price), /must be a number/);
  }
  const decimals = clonePreset("neighbourhood");
  decimals.buyers[0].quantity = "2";
  decimals.offers[0].unitPrice = "26.50";
  const normalized = validateScenario(decimals);
  assert.equal(normalized.buyers[0].quantity, 2);
  assert.equal(normalized.offers[0].unitPrice, 26.5);
});

test("price and delivery equality is compatible, and a minimum above capacity cannot qualify", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers = [{
    ...scenario.buyers[0],
    id: "B01",
    quantity: 4,
    maxUnitPrice: 20,
    latestDeliveryDays: 5,
    allowedVariants: ["Medium roast"]
  }];
  scenario.offers = [{
    ...scenario.offers[0],
    unitPrice: 20,
    deliveryDays: 5,
    minimumUnits: 4,
    capacity: 4
  }];
  const equal = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(equal.qualifies, true);
  assert.deepEqual(equal.buyerOutcomes, [{ buyerId: "B01", status: "included", reasons: [] }]);

  scenario.offers[0].unitPrice = 20.01;
  assert.deepEqual(evaluateOffer(scenario, scenario.offers[0]).buyerOutcomes[0].reasons, ["price"]);
  scenario.offers[0].unitPrice = 20;
  scenario.offers[0].deliveryDays = 6;
  assert.deepEqual(evaluateOffer(scenario, scenario.offers[0]).buyerOutcomes[0].reasons, ["delivery"]);

  scenario.offers[0].deliveryDays = 5;
  scenario.offers[0].minimumUnits = 5;
  const impossible = evaluateOffer(scenario, scenario.offers[0]);
  assert.equal(impossible.qualifies, false);
  assert.equal(impossible.fulfilledUnits, 0);
  assert.equal(impossible.tierProgress[0].maximumUnits, 4);
});

test("validation returns a detached normalized scenario", () => {
  const input = clonePreset("pantry");
  const output = validateScenario(input);
  output.buyers[0].allowedVariants.push("Changed");
  assert.equal(input.buyers[0].allowedVariants.includes("Changed"), false);
});

function sharePayload(bytesOrText) {
  const bytes = typeof bytesOrText === "string" ? new TextEncoder().encode(bytesOrText) : bytesOrText;
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

test("share encoding round trips normal cases and names decode failures", () => {
  const normal = clonePreset("neighbourhood");
  assert.deepEqual(decodeScenario(encodeScenario(normal)), validateScenario(normal));

  const json = JSON.stringify(normal);
  const malformedUtf8 = new TextEncoder().encode(json);
  malformedUtf8[json.indexOf(normal.title)] = 0x80;
  assert.throws(() => decodeScenario(sharePayload(malformedUtf8)), /not valid UTF-8/);
  assert.throws(() => decodeScenario("!!!"), /not valid base64/);
  try {
    decodeScenario(sharePayload("{"));
    assert.fail("expected invalid JSON share payload to fail");
  } catch (error) {
    assert.match(error.message, /not valid JSON/);
    assert.match(error.message, /position \d+|line \d+|Unexpected/i);
  }
  assert.throws(() => decodeScenario(sharePayload("null")), /must be an object/);

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

test("model.d.ts declares every runtime export", async () => {
  const source = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const types = await readFile(new URL("../src/model.d.ts", import.meta.url), "utf8");
  const exports = [...source.matchAll(/^export (?:class|const|function) (\w+)/gm)].map((match) => match[1]);
  assert.ok(exports.length >= 8);
  for (const name of exports) {
    assert.match(types, new RegExp(`^export (?:class|const|function) ${name}\\b`, "m"));
  }
});
