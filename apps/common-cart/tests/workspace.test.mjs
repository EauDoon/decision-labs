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

test("workspace stores hide covered leftover rows and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideCoveredLeftoverRows"), true);
  assert.equal(legacy.hideCoveredLeftoverRows, false);
  assert.equal(legacy.hideExcludedBuyers, false);
  assert.equal(legacy.hideUnwinnableOffers, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideCoveredLeftoverRows: true, hideExcludedBuyers: true, hideUnwinnableOffers: false });
  assert.equal(hidden.hideCoveredLeftoverRows, true);
  assert.equal(hidden.hideExcludedBuyers, true);
  assert.equal(hidden.hideUnwinnableOffers, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideCoveredLeftoverRows: false });
  assert.equal(shown.hideCoveredLeftoverRows, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideCoveredLeftoverRows: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideCoveredLeftoverRows: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide leftover fill row and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideLeftoverFillRow"), true);
  assert.equal(legacy.hideLeftoverFillRow, false);
  assert.equal(legacy.hideTertiaryLeftoverRow, false);
  assert.equal(legacy.hideCoveredLeftoverRows, false);
  assert.equal(legacy.hideExcludedBuyers, false);
  assert.equal(legacy.hideUnwinnableOffers, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideLeftoverFillRow: true, hideTertiaryLeftoverRow: true, hideCoveredLeftoverRows: true, hideExcludedBuyers: true, hideUnwinnableOffers: false });
  assert.equal(hidden.hideLeftoverFillRow, true);
  assert.equal(hidden.hideTertiaryLeftoverRow, true);
  assert.equal(hidden.hideCoveredLeftoverRows, true);
  assert.equal(hidden.hideExcludedBuyers, true);
  assert.equal(hidden.hideUnwinnableOffers, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideLeftoverFillRow: false });
  assert.equal(shown.hideLeftoverFillRow, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLeftoverFillRow: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLeftoverFillRow: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide zero remaining capacity offers and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideZeroRemainingCapacityOffers"), true);
  assert.equal(legacy.hideZeroRemainingCapacityOffers, false);
  assert.equal(legacy.hideUnwinnableOffers, false);
  assert.equal(legacy.hideExcludedBuyers, false);
  assert.equal(legacy.hideLeftoverFillRow, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideZeroRemainingCapacityOffers: true, hideUnwinnableOffers: true, hideExcludedBuyers: true, hideLeftoverFillRow: false });
  assert.equal(hidden.hideZeroRemainingCapacityOffers, true);
  assert.equal(hidden.hideUnwinnableOffers, true);
  assert.equal(hidden.hideExcludedBuyers, true);
  assert.equal(hidden.hideLeftoverFillRow, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideZeroRemainingCapacityOffers: false });
  assert.equal(shown.hideZeroRemainingCapacityOffers, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideZeroRemainingCapacityOffers: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideZeroRemainingCapacityOffers: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide fully filled buyers and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideFullyFilledBuyers"), true);
  assert.equal(legacy.hideFullyFilledBuyers, false);
  assert.equal(legacy.hideExcludedBuyers, false);
  assert.equal(legacy.hideUnwinnableOffers, false);
  assert.equal(legacy.hideZeroRemainingCapacityOffers, false);
  assert.equal(legacy.hideLeftoverFillRow, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideFullyFilledBuyers: true, hideExcludedBuyers: true, hideUnwinnableOffers: false, hideZeroRemainingCapacityOffers: false });
  assert.equal(hidden.hideFullyFilledBuyers, true);
  assert.equal(hidden.hideExcludedBuyers, true);
  assert.equal(hidden.hideUnwinnableOffers, false);
  assert.equal(hidden.hideZeroRemainingCapacityOffers, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideFullyFilledBuyers: false });
  assert.equal(shown.hideFullyFilledBuyers, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFullyFilledBuyers: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFullyFilledBuyers: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide buyers with leftover and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideBuyersWithLeftover"), true);
  assert.equal(legacy.hideBuyersWithLeftover, false);
  assert.equal(legacy.hideFullyFilledBuyers, false);
  assert.equal(legacy.hideExcludedBuyers, false);
  assert.equal(legacy.hideUnwinnableOffers, false);
  assert.equal(legacy.hideZeroRemainingCapacityOffers, false);
  assert.equal(legacy.hideLeftoverFillRow, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideBuyersWithLeftover: true, hideFullyFilledBuyers: false, hideExcludedBuyers: true, hideUnwinnableOffers: false, hideZeroRemainingCapacityOffers: false });
  assert.equal(hidden.hideBuyersWithLeftover, true);
  assert.equal(hidden.hideFullyFilledBuyers, false);
  assert.equal(hidden.hideExcludedBuyers, true);
  assert.equal(hidden.hideUnwinnableOffers, false);
  assert.equal(hidden.hideZeroRemainingCapacityOffers, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideBuyersWithLeftover: false });
  assert.equal(shown.hideBuyersWithLeftover, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideBuyersWithLeftover: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideBuyersWithLeftover: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide unserved buyers and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideUnservedBuyers"), true);
  assert.equal(legacy.hideUnservedBuyers, false);
  assert.equal(legacy.hideBuyersWithLeftover, false);
  assert.equal(legacy.hideFullyFilledBuyers, false);
  assert.equal(legacy.hideExcludedBuyers, false);
  assert.equal(legacy.hideUnwinnableOffers, false);
  assert.equal(legacy.hideZeroRemainingCapacityOffers, false);
  assert.equal(legacy.hideLeftoverFillRow, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideUnservedBuyers: true, hideBuyersWithLeftover: false, hideFullyFilledBuyers: false, hideExcludedBuyers: true, hideUnwinnableOffers: false, hideZeroRemainingCapacityOffers: false });
  assert.equal(hidden.hideUnservedBuyers, true);
  assert.equal(hidden.hideBuyersWithLeftover, false);
  assert.equal(hidden.hideFullyFilledBuyers, false);
  assert.equal(hidden.hideExcludedBuyers, true);
  assert.equal(hidden.hideUnwinnableOffers, false);
  assert.equal(hidden.hideZeroRemainingCapacityOffers, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideUnservedBuyers: false });
  assert.equal(shown.hideUnservedBuyers, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideUnservedBuyers: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideUnservedBuyers: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide leftover-only buyers and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideLeftoverOnlyBuyers"), true);
  assert.equal(legacy.hideLeftoverOnlyBuyers, false);
  assert.equal(legacy.hideUnservedBuyers, false);
  assert.equal(legacy.hideBuyersWithLeftover, false);
  assert.equal(legacy.hideFullyFilledBuyers, false);
  assert.equal(legacy.hideExcludedBuyers, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideLeftoverOnlyBuyers: true, hideUnservedBuyers: false, hideBuyersWithLeftover: false, hideFullyFilledBuyers: false, hideExcludedBuyers: true });
  assert.equal(hidden.hideLeftoverOnlyBuyers, true);
  assert.equal(hidden.hideUnservedBuyers, false);
  assert.equal(hidden.hideBuyersWithLeftover, false);
  assert.equal(hidden.hideFullyFilledBuyers, false);
  assert.equal(hidden.hideExcludedBuyers, true);
  const shown = validateWorkspace({ version: 1, rooms: [], hideLeftoverOnlyBuyers: false });
  assert.equal(shown.hideLeftoverOnlyBuyers, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLeftoverOnlyBuyers: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLeftoverOnlyBuyers: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide winner-allocated buyers and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideWinnerAllocatedBuyers"), true);
  assert.equal(legacy.hideWinnerAllocatedBuyers, false);
  assert.equal(legacy.hideLeftoverOnlyBuyers, false);
  assert.equal(legacy.hideUnservedBuyers, false);
  assert.equal(legacy.hideBuyersWithLeftover, false);
  assert.equal(legacy.hideFullyFilledBuyers, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideWinnerAllocatedBuyers: true, hideLeftoverOnlyBuyers: false, hideUnservedBuyers: false, hideBuyersWithLeftover: false, hideFullyFilledBuyers: false });
  assert.equal(hidden.hideWinnerAllocatedBuyers, true);
  assert.equal(hidden.hideLeftoverOnlyBuyers, false);
  assert.equal(hidden.hideUnservedBuyers, false);
  assert.equal(hidden.hideBuyersWithLeftover, false);
  assert.equal(hidden.hideFullyFilledBuyers, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideWinnerAllocatedBuyers: false });
  assert.equal(shown.hideWinnerAllocatedBuyers, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideWinnerAllocatedBuyers: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideWinnerAllocatedBuyers: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide leftover-fill buyers and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideBuyersFilledByLeftoverFill"), true);
  assert.equal(legacy.hideBuyersFilledByLeftoverFill, false);
  assert.equal(legacy.hideWinnerAllocatedBuyers, false);
  assert.equal(legacy.hideLeftoverOnlyBuyers, false);
  assert.equal(legacy.hideUnservedBuyers, false);
  assert.equal(legacy.hideBuyersWithLeftover, false);
  assert.equal(legacy.hideFullyFilledBuyers, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideBuyersFilledByLeftoverFill: true, hideWinnerAllocatedBuyers: false, hideLeftoverOnlyBuyers: false, hideUnservedBuyers: false, hideBuyersWithLeftover: false, hideFullyFilledBuyers: false });
  assert.equal(hidden.hideBuyersFilledByLeftoverFill, true);
  assert.equal(hidden.hideWinnerAllocatedBuyers, false);
  assert.equal(hidden.hideLeftoverOnlyBuyers, false);
  assert.equal(hidden.hideUnservedBuyers, false);
  assert.equal(hidden.hideBuyersWithLeftover, false);
  assert.equal(hidden.hideFullyFilledBuyers, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideBuyersFilledByLeftoverFill: false });
  assert.equal(shown.hideBuyersFilledByLeftoverFill, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideBuyersFilledByLeftoverFill: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideBuyersFilledByLeftoverFill: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide last leftover-fill buyer and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideLastBuyerFilledByLeftoverFill"), true);
  assert.equal(legacy.hideLastBuyerFilledByLeftoverFill, false);
  assert.equal(legacy.hideBuyersFilledByLeftoverFill, false);
  assert.equal(legacy.hideWinnerAllocatedBuyers, false);
  assert.equal(legacy.hideLeftoverOnlyBuyers, false);
  assert.equal(legacy.hideUnservedBuyers, false);
  assert.equal(legacy.hideBuyersWithLeftover, false);
  assert.equal(legacy.hideFullyFilledBuyers, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideLastBuyerFilledByLeftoverFill: true, hideBuyersFilledByLeftoverFill: false, hideWinnerAllocatedBuyers: false, hideLeftoverOnlyBuyers: false, hideUnservedBuyers: false, hideBuyersWithLeftover: false, hideFullyFilledBuyers: false });
  assert.equal(hidden.hideLastBuyerFilledByLeftoverFill, true);
  assert.equal(hidden.hideBuyersFilledByLeftoverFill, false);
  assert.equal(hidden.hideWinnerAllocatedBuyers, false);
  assert.equal(hidden.hideLeftoverOnlyBuyers, false);
  assert.equal(hidden.hideUnservedBuyers, false);
  assert.equal(hidden.hideBuyersWithLeftover, false);
  assert.equal(hidden.hideFullyFilledBuyers, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideLastBuyerFilledByLeftoverFill: false });
  assert.equal(shown.hideLastBuyerFilledByLeftoverFill, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLastBuyerFilledByLeftoverFill: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLastBuyerFilledByLeftoverFill: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide first leftover-fill buyer and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideFirstBuyerFilledByLeftoverFill"), true);
  assert.equal(legacy.hideFirstBuyerFilledByLeftoverFill, false);
  assert.equal(legacy.hideLastBuyerFilledByLeftoverFill, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideFirstBuyerFilledByLeftoverFill: true, hideLastBuyerFilledByLeftoverFill: false, hideBuyersFilledByLeftoverFill: false });
  assert.equal(hidden.hideFirstBuyerFilledByLeftoverFill, true);
  assert.equal(hidden.hideLastBuyerFilledByLeftoverFill, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideFirstBuyerFilledByLeftoverFill: false });
  assert.equal(shown.hideFirstBuyerFilledByLeftoverFill, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFirstBuyerFilledByLeftoverFill: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFirstBuyerFilledByLeftoverFill: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide first tertiary-fill buyer and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideFirstBuyerFilledByTertiaryFill"), true);
  assert.equal(legacy.hideFirstBuyerFilledByTertiaryFill, false);
  assert.equal(legacy.hideFirstBuyerFilledByLeftoverFill, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideFirstBuyerFilledByTertiaryFill: true, hideFirstBuyerFilledByLeftoverFill: false, hideBuyersFilledByLeftoverFill: false });
  assert.equal(hidden.hideFirstBuyerFilledByTertiaryFill, true);
  assert.equal(hidden.hideFirstBuyerFilledByLeftoverFill, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideFirstBuyerFilledByTertiaryFill: false });
  assert.equal(shown.hideFirstBuyerFilledByTertiaryFill, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFirstBuyerFilledByTertiaryFill: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFirstBuyerFilledByTertiaryFill: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide last tertiary-fill buyer and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideLastBuyerFilledByTertiaryFill"), true);
  assert.equal(legacy.hideLastBuyerFilledByTertiaryFill, false);
  assert.equal(legacy.hideFirstBuyerFilledByTertiaryFill, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideLastBuyerFilledByTertiaryFill: true, hideFirstBuyerFilledByTertiaryFill: false, hideBuyersFilledByLeftoverFill: false });
  assert.equal(hidden.hideLastBuyerFilledByTertiaryFill, true);
  assert.equal(hidden.hideFirstBuyerFilledByTertiaryFill, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideLastBuyerFilledByTertiaryFill: false });
  assert.equal(shown.hideLastBuyerFilledByTertiaryFill, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLastBuyerFilledByTertiaryFill: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLastBuyerFilledByTertiaryFill: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide last unserved buyer and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideLastUnservedBuyer"), true);
  assert.equal(legacy.hideLastUnservedBuyer, false);
  assert.equal(legacy.hideLastBuyerFilledByTertiaryFill, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideLastUnservedBuyer: true, hideLastBuyerFilledByTertiaryFill: false, hideUnservedBuyers: false });
  assert.equal(hidden.hideLastUnservedBuyer, true);
  assert.equal(hidden.hideLastBuyerFilledByTertiaryFill, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideLastUnservedBuyer: false });
  assert.equal(shown.hideLastUnservedBuyer, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLastUnservedBuyer: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLastUnservedBuyer: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide first unserved buyer and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideFirstUnservedBuyer"), true);
  assert.equal(legacy.hideFirstUnservedBuyer, false);
  assert.equal(legacy.hideLastUnservedBuyer, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideFirstUnservedBuyer: true, hideLastUnservedBuyer: false, hideUnservedBuyers: false });
  assert.equal(hidden.hideFirstUnservedBuyer, true);
  assert.equal(hidden.hideLastUnservedBuyer, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideFirstUnservedBuyer: false });
  assert.equal(shown.hideFirstUnservedBuyer, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFirstUnservedBuyer: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFirstUnservedBuyer: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide last leftover-only buyer and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideLastLeftoverOnlyBuyer"), true);
  assert.equal(legacy.hideLastLeftoverOnlyBuyer, false);
  assert.equal(legacy.hideFirstUnservedBuyer, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideLastLeftoverOnlyBuyer: true, hideFirstUnservedBuyer: false, hideLastUnservedBuyer: false });
  assert.equal(hidden.hideLastLeftoverOnlyBuyer, true);
  assert.equal(hidden.hideFirstUnservedBuyer, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideLastLeftoverOnlyBuyer: false });
  assert.equal(shown.hideLastLeftoverOnlyBuyer, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLastLeftoverOnlyBuyer: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLastLeftoverOnlyBuyer: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide first leftover-only buyer and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideFirstLeftoverOnlyBuyer"), true);
  assert.equal(legacy.hideFirstLeftoverOnlyBuyer, false);
  assert.equal(legacy.hideLastLeftoverOnlyBuyer, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideFirstLeftoverOnlyBuyer: true, hideLastLeftoverOnlyBuyer: false, hideFirstUnservedBuyer: false });
  assert.equal(hidden.hideFirstLeftoverOnlyBuyer, true);
  assert.equal(hidden.hideLastLeftoverOnlyBuyer, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideFirstLeftoverOnlyBuyer: false });
  assert.equal(shown.hideFirstLeftoverOnlyBuyer, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFirstLeftoverOnlyBuyer: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFirstLeftoverOnlyBuyer: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide last winner-allocated buyer and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideLastWinnerAllocatedBuyer"), true);
  assert.equal(legacy.hideLastWinnerAllocatedBuyer, false);
  assert.equal(legacy.hideFirstLeftoverOnlyBuyer, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideLastWinnerAllocatedBuyer: true, hideFirstLeftoverOnlyBuyer: false, hideLastLeftoverOnlyBuyer: false });
  assert.equal(hidden.hideLastWinnerAllocatedBuyer, true);
  assert.equal(hidden.hideFirstLeftoverOnlyBuyer, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideLastWinnerAllocatedBuyer: false });
  assert.equal(shown.hideLastWinnerAllocatedBuyer, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLastWinnerAllocatedBuyer: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideLastWinnerAllocatedBuyer: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide first winner-allocated buyer and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideFirstWinnerAllocatedBuyer"), true);
  assert.equal(legacy.hideFirstWinnerAllocatedBuyer, false);
  assert.equal(legacy.hideLastWinnerAllocatedBuyer, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideFirstWinnerAllocatedBuyer: true, hideLastWinnerAllocatedBuyer: false });
  assert.equal(hidden.hideFirstWinnerAllocatedBuyer, true);
  assert.equal(hidden.hideLastWinnerAllocatedBuyer, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideFirstWinnerAllocatedBuyer: false });
  assert.equal(shown.hideFirstWinnerAllocatedBuyer, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFirstWinnerAllocatedBuyer: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideFirstWinnerAllocatedBuyer: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide offers with remaining capacity and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideOffersWithRemainingCapacity"), true);
  assert.equal(legacy.hideOffersWithRemainingCapacity, false);
  assert.equal(legacy.hideZeroRemainingCapacityOffers, false);
  assert.equal(legacy.hideUnwinnableOffers, false);
  assert.equal(legacy.hideExcludedBuyers, false);
  assert.equal(legacy.hideBuyersWithLeftover, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideOffersWithRemainingCapacity: true, hideZeroRemainingCapacityOffers: false, hideUnwinnableOffers: true, hideExcludedBuyers: true, hideBuyersWithLeftover: false });
  assert.equal(hidden.hideOffersWithRemainingCapacity, true);
  assert.equal(hidden.hideZeroRemainingCapacityOffers, false);
  assert.equal(hidden.hideUnwinnableOffers, true);
  assert.equal(hidden.hideExcludedBuyers, true);
  assert.equal(hidden.hideBuyersWithLeftover, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideOffersWithRemainingCapacity: false });
  assert.equal(shown.hideOffersWithRemainingCapacity, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideOffersWithRemainingCapacity: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideOffersWithRemainingCapacity: 1 }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], extra: true }), /unexpected field/);
});

test("workspace stores hide tertiary leftover row and older files default to show-all", () => {
  const s = clonePreset();
  const legacy = validateWorkspace({ version: 1, rooms: [s] });
  assert.equal(Object.hasOwn(legacy, "hideTertiaryLeftoverRow"), true);
  assert.equal(legacy.hideTertiaryLeftoverRow, false);
  assert.equal(legacy.hideCoveredLeftoverRows, false);
  assert.equal(legacy.hideExcludedBuyers, false);
  assert.equal(legacy.hideUnwinnableOffers, false);
  const hidden = validateWorkspace({ version: 1, rooms: [s], hideTertiaryLeftoverRow: true, hideCoveredLeftoverRows: true, hideExcludedBuyers: true, hideUnwinnableOffers: false });
  assert.equal(hidden.hideTertiaryLeftoverRow, true);
  assert.equal(hidden.hideCoveredLeftoverRows, true);
  assert.equal(hidden.hideExcludedBuyers, true);
  assert.equal(hidden.hideUnwinnableOffers, false);
  const shown = validateWorkspace({ version: 1, rooms: [], hideTertiaryLeftoverRow: false });
  assert.equal(shown.hideTertiaryLeftoverRow, false);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideTertiaryLeftoverRow: "true" }), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], hideTertiaryLeftoverRow: 1 }), /true or false/);
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
