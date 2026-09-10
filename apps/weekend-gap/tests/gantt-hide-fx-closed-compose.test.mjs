import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  runSimulation
} from "../src/model.js";

test("FX-closed hide composes with payout-closed hours without changing the 72-hour model", () => {
  const split = { ...DEFAULT_SCENARIO, saturdayEarlyPayoutOpen: true };
  const hiddenFx = buildGateGanttSvg(split, 0, { hideFxClosedHours: true });
  const hiddenPayout = buildGateGanttSvg(split, 0, { hidePayoutClosedHours: true });
  const composed = buildGateGanttSvg(split, 0, { hideFxClosedHours: true, hidePayoutClosedHours: true });
  const selected = buildGateGanttSvg(split, 16, { hideFxClosedHours: true });
  const fxRects = (hiddenFx.match(/<rect /g) || []).length;
  const payoutRects = (hiddenPayout.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenFx, hiddenPayout);
  assert.notEqual(composed, hiddenFx);
  assert.notEqual(composed, hiddenPayout);
  assert.ok(composedRects < fxRects);
  assert.ok(composedRects < payoutRects);
  assert.ok(selectedRects > fxRects);
  assert.equal(attributeBottlenecks(split).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(split).timeline.length, SIMULATION_HOURS + 1);
});
