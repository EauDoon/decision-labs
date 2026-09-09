import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SCENARIO, PRESETS, compareSavedExperiments, runSimulation } from "../src/model.js";

test("saved experiment comparison accepts two or three scenarios only", () => {
  const rows = compareSavedExperiments([DEFAULT_SCENARIO, PRESETS.weekendRush, PRESETS.marketStress]);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].name, DEFAULT_SCENARIO.name);
  assert.equal(rows[1].peakQueuedAud, runSimulation(PRESETS.weekendRush).summary.peakQueuedAud);
  assert.equal(rows[2].hoursToFirstSettlement, runSimulation(PRESETS.marketStress).summary.hoursToFirstSettlement);
  assert.throws(() => compareSavedExperiments([DEFAULT_SCENARIO]), RangeError);
  assert.throws(() => compareSavedExperiments([DEFAULT_SCENARIO, PRESETS.weekendRush, PRESETS.marketStress, PRESETS.thinFxTightWindows]), RangeError);
});
