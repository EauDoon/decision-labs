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

test("weekend-payout-closed hide composes with payout-closed, weekend and weekend-payout-open without changing the 72-hour model", () => {
  const early = PRESETS.saturdayEarlyPayoutOpen;
  const fx = PRESETS.saturdayEarlyFxOpen;
  const hiddenWeekendPayoutClosed = buildGateGanttSvg(early, 0, { hideWeekendPayoutClosedHours: true });
  const hiddenPayout = buildGateGanttSvg(early, 0, { hidePayoutClosedHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenWeekendPayoutOpen = buildGateGanttSvg(early, 0, { hideWeekendPayoutOpenHours: true });
  const hiddenWeekendFx = buildGateGanttSvg(fx, 0, { hideWeekendFxOpenHours: true });
  const hiddenWeekendPayoutClosedOnFx = buildGateGanttSvg(fx, 0, { hideWeekendPayoutClosedHours: true });
  const composed = buildGateGanttSvg(early, 0, { hideWeekendPayoutClosedHours: true, hidePayoutClosedHours: true });
  const selected = buildGateGanttSvg(early, 41, { hideWeekendPayoutClosedHours: true });
  const weekendPayoutClosedRects = (hiddenWeekendPayoutClosed.match(/<rect /g) || []).length;
  const payoutRects = (hiddenPayout.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const weekendPayoutOpenRects = (hiddenWeekendPayoutOpen.match(/<rect /g) || []).length;
  const weekendFxRects = (hiddenWeekendFx.match(/<rect /g) || []).length;
  const fxClosedRects = (hiddenWeekendPayoutClosedOnFx.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenWeekendPayoutClosed, hiddenPayout);
  assert.notEqual(hiddenWeekendPayoutClosed, hiddenWeekend);
  assert.notEqual(hiddenWeekendPayoutClosed, hiddenWeekendPayoutOpen);
  assert.notEqual(hiddenWeekendPayoutClosedOnFx, hiddenWeekendFx);
  assert.notEqual(composed, hiddenWeekendPayoutClosed);
  assert.ok(composedRects <= payoutRects);
  assert.ok(weekendPayoutClosedRects !== payoutRects);
  assert.ok(weekendPayoutClosedRects !== weekendRects);
  assert.ok(weekendPayoutClosedRects !== weekendPayoutOpenRects);
  assert.ok(weekendFxRects !== fxClosedRects);
  assert.ok(selectedRects > weekendPayoutClosedRects);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayEarlyBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayEarlyBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayLateBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayLateBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
});
