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

test("weekend-payout-open hide composes with payout-open, weekend and weekend-bank-open without changing the 72-hour model", () => {
  const early = PRESETS.saturdayEarlyPayoutOpen;
  const bank = PRESETS.saturdayEarlyBankOpen;
  const issuer = PRESETS.saturdayEarlyIssuerOpen;
  const hiddenWeekendPayoutOpen = buildGateGanttSvg(early, 0, { hideWeekendPayoutOpenHours: true });
  const hiddenPayout = buildGateGanttSvg(early, 0, { hidePayoutOpenHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenPayoutClosed = buildGateGanttSvg(early, 0, { hidePayoutClosedHours: true });
  const hiddenWeekendBank = buildGateGanttSvg(bank, 0, { hideWeekendBankOpenHours: true });
  const hiddenWeekendIssuer = buildGateGanttSvg(issuer, 0, { hideWeekendIssuerOpenHours: true });
  const hiddenWeekendPayoutOpenOnBank = buildGateGanttSvg(bank, 0, { hideWeekendPayoutOpenHours: true });
  const hiddenWeekendPayoutOpenOnIssuer = buildGateGanttSvg(issuer, 0, { hideWeekendPayoutOpenHours: true });
  const composed = buildGateGanttSvg(early, 0, { hideWeekendPayoutOpenHours: true, hidePayoutOpenHours: true });
  const selected = buildGateGanttSvg(early, 16, { hideWeekendPayoutOpenHours: true });
  const weekendPayoutOpenRects = (hiddenWeekendPayoutOpen.match(/<rect /g) || []).length;
  const payoutRects = (hiddenPayout.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const closedRects = (hiddenPayoutClosed.match(/<rect /g) || []).length;
  const weekendBankRects = (hiddenWeekendBank.match(/<rect /g) || []).length;
  const issuerRects = (hiddenWeekendIssuer.match(/<rect /g) || []).length;
  const bankPayoutOpenRects = (hiddenWeekendPayoutOpenOnBank.match(/<rect /g) || []).length;
  const issuerPayoutOpenRects = (hiddenWeekendPayoutOpenOnIssuer.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenWeekendPayoutOpen, hiddenPayout);
  assert.notEqual(hiddenWeekendPayoutOpen, hiddenWeekend);
  assert.notEqual(hiddenWeekendPayoutOpen, hiddenPayoutClosed);
  assert.notEqual(hiddenWeekendPayoutOpenOnBank, hiddenWeekendBank);
  assert.notEqual(hiddenWeekendPayoutOpenOnIssuer, hiddenWeekendIssuer);
  assert.notEqual(composed, hiddenWeekendPayoutOpen);
  assert.ok(composedRects <= payoutRects);
  assert.ok(weekendPayoutOpenRects !== payoutRects);
  assert.ok(weekendPayoutOpenRects !== weekendRects);
  assert.ok(weekendPayoutOpenRects !== closedRects);
  assert.ok(weekendBankRects !== bankPayoutOpenRects);
  assert.ok(issuerRects !== issuerPayoutOpenRects);
  assert.ok(selectedRects > weekendPayoutOpenRects);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayEarlyBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayEarlyBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayLateBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayLateBankOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayEarlyIssuerOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayEarlyIssuerOpen).timeline.length, SIMULATION_HOURS + 1);
});
