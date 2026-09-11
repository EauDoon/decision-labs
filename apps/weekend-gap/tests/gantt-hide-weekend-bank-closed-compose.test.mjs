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

test("weekend-bank-closed hide composes with bank-closed, weekend and weekend-issuer-closed without changing the 72-hour model", () => {
  const saturday = PRESETS.saturdayEarlyIssuerOpen;
  const sundayBank = PRESETS.sundayLateBankClose;
  const hiddenWeekendBankClosed = buildGateGanttSvg(saturday, 0, { hideWeekendBankClosedHours: true });
  const hiddenBank = buildGateGanttSvg(saturday, 0, { hideBankClosedHours: true });
  const hiddenWeekend = buildGateGanttSvg(sundayBank, 0, { hideWeekendHours: true });
  const hiddenWeekendBankOnSunday = buildGateGanttSvg(sundayBank, 0, { hideWeekendBankClosedHours: true });
  const hiddenWeekendIssuer = buildGateGanttSvg(saturday, 0, { hideWeekendIssuerClosedHours: true });
  const composed = buildGateGanttSvg(saturday, 0, { hideWeekendBankClosedHours: true, hideBankClosedHours: true });
  const selected = buildGateGanttSvg(saturday, 16, { hideWeekendBankClosedHours: true });
  const weekendBankClosedRects = (hiddenWeekendBankClosed.match(/<rect /g) || []).length;
  const bankRects = (hiddenBank.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const sundayBankRects = (hiddenWeekendBankOnSunday.match(/<rect /g) || []).length;
  const weekendIssuerRects = (hiddenWeekendIssuer.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenWeekendBankClosed, hiddenBank);
  assert.notEqual(hiddenWeekendBankOnSunday, hiddenWeekend);
  assert.notEqual(hiddenWeekendBankClosed, hiddenWeekendIssuer);
  assert.notEqual(composed, hiddenWeekendBankClosed);
  assert.ok(composedRects <= bankRects);
  assert.ok(weekendBankClosedRects !== bankRects);
  assert.ok(sundayBankRects > weekendRects);
  assert.ok(weekendBankClosedRects !== weekendIssuerRects);
  assert.ok(selectedRects > weekendBankClosedRects);
  assert.equal(attributeBottlenecks(saturday).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(saturday).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.sundayLateBankClose).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.fridayEarlyIssuerOpen).timeline.length, SIMULATION_HOURS + 1);
});
