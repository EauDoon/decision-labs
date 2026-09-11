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

test("weekend-bank-open hide composes with bank-open, weekend and weekend-issuer-open without changing the 72-hour model", () => {
  const early = PRESETS.saturdayEarlyBankOpen;
  const issuer = PRESETS.saturdayEarlyIssuerOpen;
  const hiddenWeekendBankOpen = buildGateGanttSvg(early, 0, { hideWeekendBankOpenHours: true });
  const hiddenBank = buildGateGanttSvg(early, 0, { hideBankOpenHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenWeekendBankClosed = buildGateGanttSvg(early, 0, { hideWeekendBankClosedHours: true });
  const hiddenWeekendIssuer = buildGateGanttSvg(issuer, 0, { hideWeekendIssuerOpenHours: true });
  const hiddenWeekendBankOpenOnIssuer = buildGateGanttSvg(issuer, 0, { hideWeekendBankOpenHours: true });
  const composed = buildGateGanttSvg(early, 0, { hideWeekendBankOpenHours: true, hideBankOpenHours: true });
  const selected = buildGateGanttSvg(early, 17, { hideWeekendBankOpenHours: true });
  const weekendBankOpenRects = (hiddenWeekendBankOpen.match(/<rect /g) || []).length;
  const bankRects = (hiddenBank.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const closedRects = (hiddenWeekendBankClosed.match(/<rect /g) || []).length;
  const weekendIssuerRects = (hiddenWeekendIssuer.match(/<rect /g) || []).length;
  const issuerBankOpenRects = (hiddenWeekendBankOpenOnIssuer.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenWeekendBankOpen, hiddenBank);
  assert.notEqual(hiddenWeekendBankOpen, hiddenWeekend);
  assert.notEqual(hiddenWeekendBankOpen, hiddenWeekendBankClosed);
  assert.notEqual(hiddenWeekendBankOpenOnIssuer, hiddenWeekendIssuer);
  assert.notEqual(composed, hiddenWeekendBankOpen);
  assert.ok(composedRects <= bankRects);
  assert.ok(weekendBankOpenRects !== bankRects);
  assert.ok(weekendBankOpenRects !== weekendRects);
  assert.ok(weekendBankOpenRects !== closedRects);
  assert.ok(weekendIssuerRects !== issuerBankOpenRects);
  assert.ok(selectedRects > weekendBankOpenRects);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.saturdayEarlyIssuerOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayEarlyIssuerOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.sundayLateBankClose).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.earlyMondayBankOpen).timeline.length, SIMULATION_HOURS + 1);
});
