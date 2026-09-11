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

test("weekend-issuer-closed hide composes with issuer-closed, weekend and weekend-issuer-open without changing the 72-hour model", () => {
  const saturday = PRESETS.saturdayEarlyIssuerOpen;
  const hiddenWeekendIssuerClosed = buildGateGanttSvg(saturday, 0, { hideWeekendIssuerClosedHours: true });
  const hiddenIssuer = buildGateGanttSvg(saturday, 0, { hideIssuerClosedHours: true });
  const hiddenWeekend = buildGateGanttSvg(saturday, 0, { hideWeekendHours: true });
  const hiddenWeekendOpen = buildGateGanttSvg(saturday, 0, { hideWeekendIssuerOpenHours: true });
  const hiddenOpen = buildGateGanttSvg(saturday, 0, { hideOpenHours: true });
  const composed = buildGateGanttSvg(saturday, 0, { hideWeekendIssuerClosedHours: true, hideIssuerClosedHours: true });
  const selected = buildGateGanttSvg(saturday, 16, { hideWeekendIssuerClosedHours: true });
  const weekendIssuerClosedRects = (hiddenWeekendIssuerClosed.match(/<rect /g) || []).length;
  const issuerRects = (hiddenIssuer.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const weekendOpenRects = (hiddenWeekendOpen.match(/<rect /g) || []).length;
  const openRects = (hiddenOpen.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenWeekendIssuerClosed, hiddenIssuer);
  assert.notEqual(hiddenWeekendIssuerClosed, hiddenWeekend);
  assert.notEqual(hiddenWeekendIssuerClosed, hiddenWeekendOpen);
  assert.notEqual(hiddenWeekendIssuerClosed, hiddenOpen);
  assert.notEqual(composed, hiddenWeekendIssuerClosed);
  assert.ok(composedRects <= issuerRects);
  assert.ok(weekendIssuerClosedRects !== issuerRects);
  assert.ok(weekendIssuerClosedRects !== weekendRects);
  assert.ok(weekendIssuerClosedRects !== weekendOpenRects);
  assert.ok(weekendIssuerClosedRects !== openRects);
  assert.ok(selectedRects > weekendIssuerClosedRects);
  assert.equal(attributeBottlenecks(saturday).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(saturday).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.sundayEarlyIssuerOpen).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(PRESETS.sundayLateIssuerClose).timeline.length, SIMULATION_HOURS + 1);
});
