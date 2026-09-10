import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  runSimulation
} from "../src/model.js";

test("payout-open hide composes with FX-closed hours without changing the 72-hour model", () => {
  const split = { ...DEFAULT_SCENARIO, fridayEarlyPayoutOpen: true };
  const hiddenOpen = buildGateGanttSvg(split, 5, { hidePayoutOpenHours: true });
  const hiddenFx = buildGateGanttSvg(split, 0, { hideFxClosedHours: true });
  const hiddenClosed = buildGateGanttSvg(split, 0, { hidePayoutClosedHours: true });
  const composed = buildGateGanttSvg(split, 5, { hidePayoutOpenHours: true, hideFxClosedHours: true });
  const selected = buildGateGanttSvg(split, 3, { hidePayoutOpenHours: true });
  const openRects = (hiddenOpen.match(/<rect /g) || []).length;
  const fxRects = (hiddenFx.match(/<rect /g) || []).length;
  const closedRects = (hiddenClosed.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenOpen, hiddenFx);
  assert.notEqual(hiddenOpen, hiddenClosed);
  assert.notEqual(composed, hiddenOpen);
  assert.notEqual(composed, hiddenFx);
  assert.ok(composedRects < openRects);
  assert.ok(composedRects < fxRects);
  assert.ok(selectedRects > openRects);
  assert.ok(openRects !== closedRects);
  assert.equal(attributeBottlenecks(split).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(split).timeline.length, SIMULATION_HOURS + 1);
});
