import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clonePreset, evaluateOffer, evaluateMarket, validateScenario, encodeScenario, decodeScenario, filterOfferIdsByFulfillment } from "../src/model.js";

test("legacy offers without fulfillment default to shipping and round trip", () => {
  const scenario = clonePreset("neighbourhood");
  assert.equal(Object.hasOwn(scenario.offers[0], "fulfillment"), false);
  const normalized = validateScenario(scenario);
  assert.equal(normalized.offers[0].fulfillment, "shipping");
  const shipped = evaluateOffer(scenario, "O01");
  const explicit = structuredClone(normalized);
  const again = evaluateOffer(explicit, "O01");
  assert.equal(shipped.totalCost, again.totalCost);
  assert.equal(shipped.allocations[0].shippingCost, scenario.offers[0].shippingPerBuyer);
  assert.deepEqual(decodeScenario(encodeScenario(scenario)).offers.map((offer) => offer.fulfillment), ["shipping", "shipping", "shipping"]);
});

test("pickup ignores shippingPerBuyer in totals, allocations, and budget checks", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.offers[0].shippingPerBuyer = 40;
  scenario.offers[0].fulfillment = "pickup";
  const openBudget = evaluateOffer(scenario, "O01");
  assert.equal(openBudget.offer.fulfillment, "pickup");
  assert.equal(openBudget.offer.shippingPerBuyer, 40);
  assert.ok(openBudget.qualifies);
  assert.equal(openBudget.allocations.every((entry) => entry.shippingCost === 0), true);
  assert.equal(openBudget.totalCost, openBudget.fulfilledUnits * openBudget.effectiveUnitPrice);

  scenario.buyers.forEach((buyer) => { buyer.maxOrderTotal = buyer.quantity * 26 + 1; });
  const pickup = evaluateOffer(scenario, "O01");
  assert.ok(pickup.qualifies);
  scenario.offers[0].fulfillment = "shipping";
  const shipped = evaluateOffer(scenario, "O01");
  assert.equal(shipped.qualifies, false);
  assert.equal(shipped.buyerOutcomes.some((outcome) => outcome.reasons.includes("budget")), true);
});

test("unknown fulfillment values are rejected", () => {
  const scenario = clonePreset("studio");
  scenario.offers[0].fulfillment = "drone";
  assert.throws(() => validateScenario(scenario), /fulfillment must be shipping or pickup/);
  scenario.offers[0].fulfillment = "SHIPPING";
  assert.throws(() => validateScenario(scenario), /fulfillment must be shipping or pickup/);
});

test("pickup does not change ranking identity of a room that already used zero shipping", () => {
  const scenario = clonePreset("pantry");
  scenario.offers[2].fulfillment = "pickup";
  const market = evaluateMarket(scenario);
  assert.equal(market.winner?.offer.id, evaluateMarket(clonePreset("pantry")).winner?.offer.id);
});

test("fulfillment filter returns ids without changing saved offer order", () => {
  const scenario = clonePreset("hardware");
  const original = scenario.offers.map((offer) => offer.id);
  const all = filterOfferIdsByFulfillment(scenario, "all");
  const shipping = filterOfferIdsByFulfillment(scenario, "shipping");
  const pickup = filterOfferIdsByFulfillment(scenario, "pickup");
  assert.deepEqual(all, original);
  assert.deepEqual(shipping, ["O01", "O02"]);
  assert.deepEqual(pickup, ["O03"]);
  assert.deepEqual(scenario.offers.map((offer) => offer.id), original);
  assert.throws(() => filterOfferIdsByFulfillment(scenario, "__proto__"), /all, shipping, or pickup/);
  assert.throws(() => filterOfferIdsByFulfillment(scenario, "constructor"), /all, shipping, or pickup/);
});

test("merchant table includes an all, shipping, and pickup fulfillment filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="offer-fulfillment-filter"/u);
  assert.match(html, /<option value="all">All<\/option>/u);
  assert.match(html, /<option value="shipping">Shipping<\/option>/u);
  assert.match(html, /<option value="pickup">Pickup<\/option>/u);
  assert.match(app, /function applyOfferFulfillmentFilter\(/u);
  assert.match(app, /row\.hidden/u);
  assert.match(app, /function persistFulfillmentFilter\(/u);
  assert.match(html, /Older workspace files without it still open/u);
});
