import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  runSimulation
} from "../src/model.js";

test("bank-open hide composes with bank-closed hours without changing the 72-hour model", () => {
  const split = { ...DEFAULT_SCENARIO, sundayLateBankClose: true };
  const hiddenOpen = buildGateGanttSvg(split, 2, { hideBankOpenHours: true });
  const hiddenBank = buildGateGanttSvg(split, 0, { hideBankClosedHours: true });
  const hiddenFx = buildGateGanttSvg(split, 0, { hideFxOpenHours: true });
  const composed = buildGateGanttSvg(split, 2, { hideBankOpenHours: true, hideBankClosedHours: true });
  const selected = buildGateGanttSvg(split, 49, { hideBankOpenHours: true });
  const openRects = (hiddenOpen.match(/<rect /g) || []).length;
  const bankRects = (hiddenBank.match(/<rect /g) || []).length;
  const fxRects = (hiddenFx.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenOpen, hiddenBank);
  assert.notEqual(hiddenOpen, hiddenFx);
  assert.notEqual(composed, hiddenOpen);
  assert.notEqual(composed, hiddenBank);
  assert.ok(composedRects < openRects);
  assert.ok(composedRects < bankRects);
  assert.ok(selectedRects > openRects);
  assert.ok(openRects !== bankRects);
  assert.ok(openRects !== fxRects);
  assert.equal(attributeBottlenecks(split).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(split).timeline.length, SIMULATION_HOURS + 1);
});
