import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  runSimulation
} from "../src/model.js";

test("payout-closed hide composes with issuer-closed hours without changing the 72-hour model", () => {
  const split = { ...DEFAULT_SCENARIO, payoutOpenEndHour: 16, issuerOpenStartHour: 9 };
  const hiddenPayout = buildGateGanttSvg(split, 0, { hidePayoutClosedHours: true });
  const hiddenIssuer = buildGateGanttSvg(split, 0, { hideIssuerClosedHours: true });
  const composed = buildGateGanttSvg(split, 0, { hidePayoutClosedHours: true, hideIssuerClosedHours: true });
  const selected = buildGateGanttSvg(split, 1, { hidePayoutClosedHours: true });
  const payoutRects = (hiddenPayout.match(/<rect /g) || []).length;
  const issuerRects = (hiddenIssuer.match(/<rect /g) || []).length;
  const composedRects = (composed.match(/<rect /g) || []).length;
  const selectedRects = (selected.match(/<rect /g) || []).length;
  assert.notEqual(hiddenPayout, hiddenIssuer);
  assert.notEqual(composed, hiddenPayout);
  assert.notEqual(composed, hiddenIssuer);
  assert.ok(composedRects < payoutRects);
  assert.ok(composedRects < issuerRects);
  assert.ok(selectedRects > payoutRects);
  assert.equal(attributeBottlenecks(split).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(split).timeline.length, SIMULATION_HOURS + 1);
});
