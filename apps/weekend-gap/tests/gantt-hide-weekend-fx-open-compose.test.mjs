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

test("weekend-FX-open hide composes with FX-open, weekend and weekend-payout-open without changing the 72-hour model", () => {
  const early = PRESETS.saturdayEarlyFxOpen;
  const bank = PRESETS.saturdayEarlyBankOpen;
  const payout = PRESETS.saturdayEarlyPayoutOpen;
  const hiddenWeekendFxOpen = buildGateGanttSvg(early, 0, { hideWeekendFxOpenHours: true });
  const hiddenFx = buildGateGanttSvg(early, 0, { hideFxOpenHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenFxClosed = buildGateGanttSvg(early, 0, { hideFxClosedHours: true });
  const hiddenWeekendPayout = buildGateGanttSvg(payout, 0, { hideWeekendPayoutOpenHours: true });
  const hiddenWeekendBank = buildGateGanttSvg(bank, 0, { hideWeekendBankOpenHours: true });
  const hiddenWeekendFxOpenOnBank = buildGateGanttSvg(bank, 0, { hideWeekendFxOpenHours: true });
  const hiddenWeekendFxOpenOnPayout = buildGateGanttSvg(payout, 0, { hideWeekendFxOpenHours: true });
  const composed = buildGateGanttSvg(early, 0, { hideWeekendFxOpenHours: true, hideFxOpenHours: true });
  const selected = buildGateGanttSvg(early, 15, { hideWeekendFxOpenHours: true });
  const weekendFxOpenRects = (hiddenWeekendFxOpen.match(/<rect /g) || []).length;
  const fxRects = (hiddenFx.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const closedRects = (hiddenFxClosed.match(/<rect /g) || []).length;
  const weekendPayoutRects = (hiddenWeekendPayout.match(/<rect /g) || []).length;
  const weekendBankRects = (hiddenWeekendBank.match(/<rect /g) || []).length;
  const bankFxOpenRects = (hiddenWeekendFxOpenOnBank.match(/<rect /g) || []).length;
  const payoutFxOpenRects = (hiddenWeekendFxOpenOnPayout.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenWeekendFxOpen, hiddenFx);
  assert.notEqual(hiddenWeekendFxOpen, hiddenWeekend);
  assert.notEqual(hiddenWeekendFxOpen, hiddenFxClosed);
  assert.notEqual(hiddenWeekendFxOpenOnBank, hiddenWeekendBank);
  assert.notEqual(hiddenWeekendFxOpenOnPayout, hiddenWeekendPayout);
  assert.notEqual(composed, hiddenWeekendFxOpen);
  assert.ok(composedRects <= fxRects);
  assert.ok(weekendFxOpenRects !== fxRects);
  assert.ok(weekendFxOpenRects !== weekendRects);
  assert.ok(weekendFxOpenRects !== closedRects);
  assert.ok(weekendBankRects !== bankFxOpenRects);
  assert.ok(weekendPayoutRects !== payoutFxOpenRects);
  assert.ok(selectedRects > weekendFxOpenRects);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayEarlyBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayEarlyBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayLateBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayLateBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayEarlyPayoutOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayLateFxOpen).timeline.length, SIMULATION_HOURS + 1);
});
