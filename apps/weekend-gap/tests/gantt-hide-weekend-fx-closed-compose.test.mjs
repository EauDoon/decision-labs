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

test("weekend-FX-closed hide composes with FX-closed, weekend and weekend-FX-open without changing the 72-hour model", () => {
  const early = PRESETS.saturdayEarlyFxOpen;
  const payout = PRESETS.saturdayEarlyPayoutOpen;
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const hiddenWeekendFxClosed = buildGateGanttSvg(early, 0, { hideWeekendFxClosedHours: true });
  const hiddenFx = buildGateGanttSvg(early, 0, { hideFxClosedHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenWeekendFxOpen = buildGateGanttSvg(early, 0, { hideWeekendFxOpenHours: true });
  const hiddenWeekendPayout = buildGateGanttSvg(payout, 0, { hideWeekendPayoutClosedHours: true });
  const hiddenWeekendFxClosedOnPayout = buildGateGanttSvg(payout, 0, { hideWeekendFxClosedHours: true });
  const composed = buildGateGanttSvg(early, 0, { hideWeekendFxClosedHours: true, hideFxClosedHours: true });
  const selected = buildGateGanttSvg(early, 41, { hideWeekendFxClosedHours: true });
  const weekendFxClosedRects = (hiddenWeekendFxClosed.match(/<rect /g) || []).length;
  const fxRects = (hiddenFx.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const weekendFxOpenRects = (hiddenWeekendFxOpen.match(/<rect /g) || []).length;
  const weekendPayoutRects = (hiddenWeekendPayout.match(/<rect /g) || []).length;
  const fxClosedOnPayoutRects = (hiddenWeekendFxClosedOnPayout.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenWeekendFxClosed, hiddenWeekend);
  assert.notEqual(hiddenWeekendFxClosed, hiddenWeekendFxOpen);
  assert.notEqual(hiddenWeekendFxClosedOnPayout, hiddenWeekendPayout);
  assert.equal(composedRects, fxRects);
  assert.ok(weekendFxClosedRects !== weekendRects);
  assert.ok(weekendFxClosedRects !== weekendFxOpenRects);
  assert.ok(weekendPayoutRects !== fxClosedOnPayoutRects);
  assert.ok(selectedRects > weekendFxClosedRects);
  const holidayHiddenWeekendFxClosed = buildGateGanttSvg(holiday, 0, { hideWeekendFxClosedHours: true });
  const holidayHiddenFxClosed = buildGateGanttSvg(holiday, 0, { hideFxClosedHours: true });
  assert.notEqual(holidayHiddenWeekendFxClosed, holidayHiddenFxClosed);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayEarlyBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayEarlyBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayLateBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayLateBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.sundayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
});
