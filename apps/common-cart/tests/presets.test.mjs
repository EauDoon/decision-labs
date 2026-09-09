import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, evaluateMarket, validateScenario } from "../src/model.js";

test("office pantry and hardware presets evaluate with distinct categories", () => {
  const office = evaluateMarket(clonePreset("officePantry"));
  const hardware = evaluateMarket(clonePreset("hardware"));
  assert.ok(office.winner);
  assert.ok(hardware.winner);
  assert.equal(office.categoryCount, 1);
  assert.equal(hardware.categoryCount, 1);
  assert.equal(office.scenario.buyers[0].category, "Office pantry crate");
  assert.equal(hardware.scenario.buyers[0].category, "Hand tool kit");
  assert.ok(office.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Sweet snack")));
  assert.ok(hardware.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Imperial")));
  assert.notEqual(office.winner.offer.category, hardware.winner.offer.category);
  assert.ok(hardware.results.some((result) => result.offer.fulfillment === "pickup"));
});

test("new presets survive validation and keep a deterministic winner", () => {
  for (const name of ["officePantry", "hardware"]) {
    const first = evaluateMarket(clonePreset(name));
    const second = evaluateMarket(validateScenario(clonePreset(name)));
    assert.equal(first.winner.offer.id, second.winner.offer.id);
    assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
  }
});
