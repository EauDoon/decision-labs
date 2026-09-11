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

test("weekday-FX-closed hide composes with FX-closed, weekend-FX-closed and weekend without changing the 72-hour model", () => {
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const early = PRESETS.saturdayEarlyFxOpen;
  const hiddenWeekdayFxClosed = buildGateGanttSvg(holiday, 0, { hideWeekdayFxClosedHours: true });
  const hiddenFx = buildGateGanttSvg(holiday, 0, { hideFxClosedHours: true });
  const hiddenWeekendFxClosed = buildGateGanttSvg(holiday, 0, { hideWeekendFxClosedHours: true });
  const hiddenWeekend = buildGateGanttSvg(holiday, 0, { hideWeekendHours: true });
  const composed = buildGateGanttSvg(holiday, 0, { hideWeekdayFxClosedHours: true, hideFxClosedHours: true });
  const selected = buildGateGanttSvg(holiday, 65, { hideWeekdayFxClosedHours: true });
  const weekdayFxClosedRects = (hiddenWeekdayFxClosed.match(/<rect /g) || []).length;
  const fxRects = (hiddenFx.match(/<rect /g) || []).length;
  const weekendFxClosedRects = (hiddenWeekendFxClosed.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenWeekdayFxClosed, hiddenFx);
  assert.notEqual(hiddenWeekdayFxClosed, hiddenWeekendFxClosed);
  assert.notEqual(hiddenWeekdayFxClosed, hiddenWeekend);
  assert.equal(composedRects, fxRects);
  assert.ok(weekdayFxClosedRects !== weekendFxClosedRects);
  assert.ok(weekdayFxClosedRects !== weekendRects);
  assert.ok(selectedRects > weekdayFxClosedRects);
  const earlyHiddenWeekday = buildGateGanttSvg(early, 0, { hideWeekdayFxClosedHours: true });
  const earlyHiddenWeekendFxClosed = buildGateGanttSvg(early, 0, { hideWeekendFxClosedHours: true });
  assert.notEqual(earlyHiddenWeekday, earlyHiddenWeekendFxClosed);
  assert.equal(attributeBottlenecks(holiday).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(holiday).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayEarlyFxOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
});
