import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  runSimulation
} from "../src/model.js";

test("FX-open hide composes with FX-closed hours without changing the 72-hour model", () => {
  const split = { ...DEFAULT_SCENARIO, saturdayEarlyFxOpen: true };
  const hiddenOpen = buildGateGanttSvg(split, 9, { hideFxOpenHours: true });
  const hiddenFx = buildGateGanttSvg(split, 0, { hideFxClosedHours: true });
  const hiddenPayout = buildGateGanttSvg(split, 0, { hidePayoutOpenHours: true });
  const composed = buildGateGanttSvg(split, 9, { hideFxOpenHours: true, hideFxClosedHours: true });
  const selected = buildGateGanttSvg(split, 15, { hideFxOpenHours: true });
  const openRects = (hiddenOpen.match(/<rect /g) || []).length;
  const fxRects = (hiddenFx.match(/<rect /g) || []).length;
  const payoutRects = (hiddenPayout.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenOpen, hiddenFx);
  assert.notEqual(hiddenOpen, hiddenPayout);
  assert.notEqual(composed, hiddenOpen);
  assert.notEqual(composed, hiddenFx);
  assert.ok(composedRects < openRects);
  assert.ok(composedRects < fxRects);
  assert.ok(selectedRects > openRects);
  assert.ok(openRects !== fxRects);
  assert.ok(openRects !== payoutRects);
  assert.equal(attributeBottlenecks(split).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(split).timeline.length, SIMULATION_HOURS + 1);
});
