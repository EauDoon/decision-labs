import test from "node:test";
import assert from "node:assert/strict";
import { capacityBar, clonePreset } from "../src/model.js";

test("capacity bar reports filled units, leftover capacity, and the next-tier mark", () => {
  const scenario = clonePreset("tiers");
  const bar = capacityBar(scenario, "O01");
  assert.equal(bar.filledUnits, 20);
  assert.equal(bar.capacity, 20);
  assert.equal(bar.leftoverUnits, 0);
  assert.equal(bar.nextTierThreshold, null);
  assert.equal(bar.qualifies, true);
});

test("capacity bar keeps leftover units when a qualifying offer is below capacity", () => {
  const scenario = clonePreset("neighbourhood");
  const bar = capacityBar(scenario, "O01");
  assert.equal(bar.filledUnits, 12);
  assert.equal(bar.capacity, 20);
  assert.equal(bar.leftoverUnits, 8);
  assert.equal(bar.minimumUnits, 8);
  assert.equal(bar.nextTierThreshold, null);
});
