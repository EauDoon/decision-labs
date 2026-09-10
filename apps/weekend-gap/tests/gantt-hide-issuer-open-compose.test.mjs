import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  runSimulation
} from "../src/model.js";

test("issuer-open hide composes with issuer-closed hours without changing the 72-hour model", () => {
  const split = { ...DEFAULT_SCENARIO, sundayLateIssuerClose: true };
  const hiddenOpen = buildGateGanttSvg(split, 2, { hideIssuerOpenHours: true });
  const hiddenIssuer = buildGateGanttSvg(split, 0, { hideIssuerClosedHours: true });
  const hiddenBank = buildGateGanttSvg(split, 0, { hideBankOpenHours: true });
  const composed = buildGateGanttSvg(split, 2, { hideIssuerOpenHours: true, hideIssuerClosedHours: true });
  const selected = buildGateGanttSvg(split, 49, { hideIssuerOpenHours: true });
  const openRects = (hiddenOpen.match(/<rect /g) || []).length;
  const issuerRects = (hiddenIssuer.match(/<rect /g) || []).length;
  const bankRects = (hiddenBank.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenOpen, hiddenIssuer);
  assert.notEqual(hiddenOpen, hiddenBank);
  assert.notEqual(composed, hiddenOpen);
  assert.notEqual(composed, hiddenIssuer);
  assert.ok(composedRects < openRects);
  assert.ok(composedRects < issuerRects);
  assert.ok(selectedRects > openRects);
  assert.ok(openRects !== issuerRects);
  assert.ok(openRects !== bankRects);
  assert.equal(attributeBottlenecks(split).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(split).timeline.length, SIMULATION_HOURS + 1);
});
