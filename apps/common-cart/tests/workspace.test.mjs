import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, createScenarioHistory, validateWorkspace, duplicateEntry, compareScenarios, compareThreeRooms, copyOfferAsNewTierSet, copyOfferAsPickup, evaluateOffer, landedTotalsComparison } from "../src/model.js";

test("history detaches states, caps memory, and truncates branches", () => {
  const s = clonePreset(); const h = createScenarioHistory(s);
  h.record(s); assert.equal(h.canUndo, false);
  s.title = "A"; h.record(s); s.title = "B"; h.record(s);
  assert.equal(h.undo().title, "A"); assert.ok(h.canRedo);
  s.title = "C"; h.record(s); assert.equal(h.canRedo, false);
  const copy = h.current(); copy.title = "Mutated";
  assert.equal(h.current().title, "C");
  for (let i = 0; i < 60; i++) { s.title = `Room ${i}`; h.record(s); }
  let count = 0; while (h.canUndo) { h.undo(); count++; }
  assert.equal(count, 49);
  assert.throws(() => h.record({}));
});

test("mixed currencies omit landed totals instead of converting them", () => {
  const before = clonePreset("neighbourhood");
  const after = clonePreset("neighbourhood");
  after.currency = "USD";
  const comparison = compareScenarios(before, after);
  assert.equal(comparison.sameCurrency, false);
  assert.equal(comparison.sameDemand, true);
  assert.equal(comparison.baseline.cost, null);
  assert.equal(comparison.current.cost, null);
  assert.match(comparison.currencyWarning, /different currencies/);
  assert.match(comparison.currencyWarning, /not compared/);
  assert.equal(JSON.stringify(comparison).includes("0.67"), false);
  const note = landedTotalsComparison("aud", "USD");
  assert.equal(note.comparable, false);
  assert.equal(landedTotalsComparison("AUD", "AUD").comparable, true);
  assert.throws(() => landedTotalsComparison("__proto__", "AUD"));
});

test("duplicate gives a unique id and independent nested constraints", () => {
  const s = clonePreset("tiers");
  const buyers = duplicateEntry(s, "buyers", s.buyers[0].id);
  assert.equal(new Set(buyers.buyers.map(b => b.id)).size, buyers.buyers.length);
  buyers.buyers.at(-1).allowedVariants.push("Changed");
  assert.notDeepEqual(buyers.buyers.at(-1).allowedVariants, buyers.buyers[0].allowedVariants);
  const offers = duplicateEntry(s, "offers", s.offers[0].id);
  assert.equal(offers.offers.length, s.offers.length + 1);
  assert.throws(() => duplicateEntry(s, "__proto__", s.buyers[0].id));
  assert.throws(() => duplicateEntry(s, "buyers", "missing"));
});

test("copy offer as a new tier set adds an independent cheaper band", () => {
  const s = clonePreset("neighbourhood");
  const next = copyOfferAsNewTierSet(s, s.offers[0].id);
  assert.equal(next.offers.length, s.offers.length + 1);
  const copy = next.offers.at(-1);
  assert.match(copy.merchant, /tier set/);
  assert.ok(copy.tiers?.length >= 1);
  assert.ok(copy.tiers.at(-1).unitPrice < copy.unitPrice);
  assert.ok(copy.tiers.at(-1).minimumUnits > copy.minimumUnits);
  copy.tiers[0].unitPrice = 0;
  assert.notEqual(s.offers[0].tiers, copy.tiers);
  const original = evaluateOffer(s, s.offers[0].id);
  const copied = evaluateOffer(next, copy.id);
  assert.equal(typeof copied.fulfilledUnits, "number");
  assert.equal(original.offer.id, s.offers[0].id);
});

test("copy offer as a pickup clone zeros shipping and leaves the source offer unchanged", () => {
  const s = clonePreset("neighbourhood");
  const shipped = evaluateOffer(s, s.offers[0].id);
  assert.ok(shipped.allocations.some((entry) => entry.shippingCost > 0));
  const next = copyOfferAsPickup(s, s.offers[0].id);
  assert.equal(next.offers.length, s.offers.length + 1);
  const copy = next.offers.at(-1);
  assert.match(copy.merchant, /pickup/);
  assert.equal(copy.fulfillment, "pickup");
  assert.equal(copy.shippingPerBuyer, 0);
  assert.equal(s.offers[0].fulfillment, undefined);
  assert.equal(s.offers[0].shippingPerBuyer, 2);
  const pickup = evaluateOffer(next, copy.id);
  assert.equal(pickup.allocations.every((entry) => entry.shippingCost === 0), true);
  assert.equal(pickup.totalCost, pickup.fulfilledUnits * pickup.effectiveUnitPrice);
  copy.merchant = "Mutated pickup";
  assert.equal(s.offers[0].merchant, "Harbour Roasters");
});

test("workspace validates every room and rejects unsupported schema or oversized collections", () => {
  const s = clonePreset();
  const workspace = validateWorkspace({ version: 1, rooms: [s] });
  s.title = "Changed";
  assert.notEqual(workspace.rooms[0].title, s.title);
  assert.equal(workspace.fulfillmentFilter, "all");
  for (const invalid of [{ version: 2, rooms: [] }, { version: 1, rooms: [{}] }, { version: 1, rooms: Array(13).fill(s) }, { version: 1, rooms: [], extra: true }]) {
    assert.throws(() => validateWorkspace(invalid));
  }
});

test("workspace stores an optional fulfillment filter and older files omit it safely", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "fulfillmentFilter"), true);
  assert.equal(legacy.fulfillmentFilter, "all");
  const pickup = validateWorkspace({ version: 1, rooms: [s], fulfillmentFilter: "pickup" });
  assert.equal(pickup.fulfillmentFilter, "pickup");
  const shipping = validateWorkspace({ version: 1, rooms: [], fulfillmentFilter: "shipping" });
  assert.equal(shipping.rooms.length, 0);
  assert.equal(shipping.fulfillmentFilter, "shipping");
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], fulfillmentFilter: "drone" }), /all, shipping, or pickup/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], fulfillmentFilter: "__proto__" }), /all, shipping, or pickup/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], constructor: "all" }), /unexpected field: constructor/);
});

test("workspace stores hide excluded buyers and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideExcludedBuyers"), true);
  assert.equal(legacy.hideExcludedBuyers, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideExcludedBuyers: true });
  assert.equal(hidden.hideExcludedBuyers, true);
  const shown = validateWorkspace({ version: 1, rooms: [], hideExcludedBuyers: false });
  assert.equal(shown.hideExcludedBuyers, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideExcludedBuyers: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideExcludedBuyers: 1 }), /true or false/);
});

test("workspace stores hide unwinnable offers and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideUnwinnableOffers"), true);
  assert.equal(legacy.hideUnwinnableOffers, false);
  assert.equal(legacy.hideExcludedBuyers, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideUnwinnableOffers: true, hideExcludedBuyers: true });
  assert.equal(hidden.hideUnwinnableOffers, true);
  assert.equal(hidden.hideExcludedBuyers, true);
  const shown = validateWorkspace({ version: 1, rooms: [], hideUnwinnableOffers: false });
  assert.equal(shown.hideUnwinnableOffers, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideUnwinnableOffers: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideUnwinnableOffers: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("scenario comparison includes residual leftover and unfilled counts", () => {
  const before = clonePreset("neighbourhood");
  const after = clonePreset("neighbourhood");
  after.buyers[3].quantity += 1;
  const comparison = compareScenarios(before, after);
  assert.equal(typeof comparison.baseline.leftoverBuyers, "number");
  assert.equal(typeof comparison.baseline.leftoverUnits, "number");
  assert.equal(typeof comparison.baseline.unfilledBuyers, "number");
  assert.equal(typeof comparison.baseline.unfilledUnits, "number");
  assert.equal(typeof comparison.current.leftoverBuyers, "number");
  assert.equal(typeof comparison.current.unfilledUnits, "number");
  assert.equal(comparison.sameDemand, false);
});

test("three-room comparison reports winners without mixing currencies", () => {
  const a = clonePreset("neighbourhood");
  const b = clonePreset("studio");
  const c = clonePreset("hardware");
  c.currency = "USD";
  const comparison = compareThreeRooms(a, b, c);
  assert.equal(comparison.rooms.length, 3);
  assert.equal(comparison.sameCurrency, false);
  assert.match(comparison.currencyWarning, /not compared/);
  assert.ok(comparison.rooms.every((room) => room.cost === null));
  assert.equal(comparison.rooms[0].winner, compareScenarios(a, a).baseline.winner);
  assert.ok(comparison.rooms.every((room) => typeof room.fulfilled === "number"));
  assert.ok(comparison.rooms.every((room) => typeof room.leftoverBuyers === "number"));
  assert.ok(comparison.rooms.every((room) => typeof room.unfilledUnits === "number"));
  assert.throws(() => compareThreeRooms(a, b, {}), /Room 3 is invalid/);
});
