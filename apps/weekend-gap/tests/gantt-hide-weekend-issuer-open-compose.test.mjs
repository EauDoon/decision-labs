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

test("weekend-issuer-open hide composes with issuer-open and weekend hours without changing the 72-hour model", () => {
  const early = PRESETS.sundayEarlyIssuerOpen;
  const hiddenWeekendIssuer = buildGateGanttSvg(early, 0, { hideWeekendIssuerOpenHours: true });
  const hiddenIssuer = buildGateGanttSvg(early, 0, { hideIssuerOpenHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const composed = buildGateGanttSvg(early, 0, { hideWeekendIssuerOpenHours: true, hideIssuerOpenHours: true });
  const selected = buildGateGanttSvg(early, 41, { hideWeekendIssuerOpenHours: true });
  const weekendIssuerRects = (hiddenWeekendIssuer.match(/<rect /g) || []).length;
  const issuerRects = (hiddenIssuer.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenWeekendIssuer, hiddenIssuer);
  assert.notEqual(hiddenWeekendIssuer, hiddenWeekend);
  assert.notEqual(composed, hiddenWeekendIssuer);
  assert.ok(composedRects <= issuerRects);
  assert.ok(weekendIssuerRects !== issuerRects);
  assert.ok(weekendIssuerRects !== weekendRects);
  assert.ok(selectedRects > weekendIssuerRects);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});
