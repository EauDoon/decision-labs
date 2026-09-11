import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  runSimulation
} from "../src/model.js";

test("weekday-FX-open hide composes with FX-open, weekend-FX-open and weekday-FX-closed without changing the 72-hour model", () => {
  const early = PRESETS.sundayEarlyFxOpen;
  const hiddenWeekdayFxOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayFxOpenHours: true });
  const hiddenFx = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxOpenHours: true });
  const hiddenWeekendFxOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendFxOpenHours: true });
  const hiddenWeekdayFxClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayFxClosedHours: true });
  const composed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayFxOpenHours: true, hideFxOpenHours: true });
  const selected = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayFxOpenHours: true });
  const weekdayFxOpenRects = (hiddenWeekdayFxOpen.match(/<rect /g) || []).length;
  const fxRects = (hiddenFx.match(/<rect /g) || []).length;
  const weekendFxOpenRects = (hiddenWeekendFxOpen.match(/<rect /g) || []).length;
  const weekdayFxClosedRects = (hiddenWeekdayFxClosed.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenWeekdayFxOpen, hiddenFx);
  assert.notEqual(hiddenWeekdayFxOpen, hiddenWeekendFxOpen);
  assert.notEqual(hiddenWeekdayFxOpen, hiddenWeekdayFxClosed);
  assert.ok(composedRects <= fxRects);
  assert.ok(weekdayFxOpenRects !== weekendFxOpenRects);
  assert.ok(weekdayFxOpenRects !== weekdayFxClosedRects);
  assert.ok(selectedRects === weekdayFxOpenRects);
  const earlyHiddenWeekday = buildGateGanttSvg(early, 0, { hideWeekdayFxOpenHours: true });
  const earlyHiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendFxOpenHours: true });
  assert.notEqual(earlyHiddenWeekday, earlyHiddenWeekend);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.sundayEarlyFxOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.sundayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
});
