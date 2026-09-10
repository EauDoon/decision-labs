import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  buildGateSchedule,
  ganttHourBankClosed,
  ganttHourClosedOnEveryGate,
  ganttHourFxClosed,
  ganttHourIssuerClosed,
  ganttHourOpenOnEveryGate,
  ganttHourPayoutClosed,
  runSimulation
} from "../src/model.js";

test("FX-closed helper hides hours whose FX gate is weekend-thinned", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourFxClosed(schedule.hours[0]), false);
  assert.equal(ganttHourFxClosed(schedule.hours[9]), true);
  assert.equal(ganttHourPayoutClosed(schedule.hours[2]), true);
  assert.equal(ganttHourFxClosed(schedule.hours[2]), false);
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourFxClosed(null), false);
  assert.equal(ganttHourFxClosed({}), false);
  const lateFx = { ...DEFAULT_SCENARIO, fridayFxLateClose: true };
  const lateSchedule = buildGateSchedule(lateFx);
  assert.equal(ganttHourFxClosed(lateSchedule.hours[9]), false);
  assert.equal(ganttHourPayoutClosed(lateSchedule.hours[9]), true);
  assert.equal(ganttHourIssuerClosed(lateSchedule.hours[9]), true);
  assert.equal(ganttHourBankClosed(lateSchedule.hours[9]), true);
  const fxClosed = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourFxClosed(point)).length;
  const fxOpen = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && !ganttHourFxClosed(point)).length;
  assert.ok(fxClosed > 0);
  assert.ok(fxOpen > 0);
  assert.equal(fxClosed + fxOpen, SIMULATION_HOURS);
});

test("hide-FX-closed Gantt SVG is display-only and keeps the selected hour visible", () => {
  const earlyPayout = { ...DEFAULT_SCENARIO, saturdayEarlyPayoutOpen: true };
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const hiddenFx = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxClosedHours: true });
  const hiddenPayout = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hidePayoutClosedHours: true });
  const hiddenIssuer = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true });
  const hiddenBank = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankClosedHours: true });
  const splitFx = buildGateGanttSvg(earlyPayout, 0, { hideFxClosedHours: true });
  const splitPayout = buildGateGanttSvg(earlyPayout, 0, { hidePayoutClosedHours: true });
  const hiddenOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideOpenHours: true });
  const composedOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxClosedHours: true, hideOpenHours: true });
  const hiddenClosed = buildGateGanttSvg(earlyPayout, 0, { hideClosedHours: true });
  const composedClosed = buildGateGanttSvg(earlyPayout, 0, { hideFxClosedHours: true, hideClosedHours: true });
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayHours: true });
  const composedWeekday = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxClosedHours: true, hideWeekdayHours: true });
  const weekendOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  const composedWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxClosedHours: true, hideWeekendHours: true });
  const hiddenZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true });
  const composedZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxClosedHours: true, hideZeroQueueHours: true });
  const composedPayout = buildGateGanttSvg(earlyPayout, 0, { hideFxClosedHours: true, hidePayoutClosedHours: true });
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const everyClosed = buildGateGanttSvg(holiday, 0, { everyClosedOnly: true });
  const composedEvery = buildGateGanttSvg(holiday, 0, { hideFxClosedHours: true, everyClosedOnly: true });
  const closedOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { closedOnly: true });
  const composedClosedOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxClosedHours: true, closedOnly: true });
  const payoutOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxClosedHours: true, gateFilter: "payout" });
  const selectedClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 9, { hideFxClosedHours: true });
  const hiddenFxEarly = buildGateGanttSvg(earlyPayout, 0, { hideFxClosedHours: true });
  assert.notEqual(full, hiddenFx);
  assert.notEqual(hiddenFx, hiddenPayout);
  assert.notEqual(splitFx, splitPayout);
  assert.notEqual(hiddenFx, hiddenOpen);
  assert.notEqual(hiddenFxEarly, hiddenClosed);
  assert.notEqual(hiddenFx, hiddenZero);
  assert.match(hiddenFx, /viewBox="0 0 720/);
  const hiddenRects = (hiddenFx.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const composedOpenRects = (composedOpen.match(/<rect /g) || []).length;
  const hiddenOpenRects = (hiddenOpen.match(/<rect /g) || []).length;
  const composedClosedRects = (composedClosed.match(/<rect /g) || []).length;
  const hiddenClosedRects = (hiddenClosed.match(/<rect /g) || []).length;
  const weekdayRects = (weekdayOnly.match(/<rect /g) || []).length;
  const composedWeekdayRects = (composedWeekday.match(/<rect /g) || []).length;
  const weekendRects = (weekendOnly.match(/<rect /g) || []).length;
  const composedWeekendRects = (composedWeekend.match(/<rect /g) || []).length;
  const composedZeroRects = (composedZero.match(/<rect /g) || []).length;
  const hiddenZeroRects = (hiddenZero.match(/<rect /g) || []).length;
  const splitFxRects = (splitFx.match(/<rect /g) || []).length;
  const splitPayoutRects = (splitPayout.match(/<rect /g) || []).length;
  const composedPayoutRects = (composedPayout.match(/<rect /g) || []).length;
  const everyRects = (everyClosed.match(/<rect /g) || []).length;
  const composedEveryRects = (composedEvery.match(/<rect /g) || []).length;
  const closedOnlyRects = (closedOnly.match(/<rect /g) || []).length;
  const composedClosedOnlyRects = (composedClosedOnly.match(/<rect /g) || []).length;
  const payoutRects = (payoutOnly.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedClosed.match(/<rect /g) || []).length;
  const hiddenPayoutRects = (hiddenPayout.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(composedOpenRects < hiddenOpenRects);
  assert.ok(composedClosedRects < hiddenClosedRects);
  assert.ok(composedWeekdayRects <= weekdayRects);
  assert.ok(composedWeekendRects <= weekendRects);
  assert.ok(composedZeroRects < hiddenZeroRects);
  assert.ok(composedPayoutRects < splitPayoutRects);
  assert.ok(composedPayoutRects <= splitFxRects);
  assert.ok(composedEveryRects <= everyRects);
  assert.ok(composedClosedOnlyRects < closedOnlyRects);
  assert.ok(payoutRects < hiddenRects);
  assert.ok(selectedClosedRects > hiddenRects);
  assert.notEqual(hiddenFx, hiddenIssuer);
  assert.notEqual(hiddenFx, hiddenBank);
  assert.ok(hiddenRects !== hiddenPayoutRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-FX-closed Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-fx-closed"/);
  assert.match(html, /Hide hours where the FX gate is closed/);
  assert.match(html, /id="gantt-hide-payout-closed"/);
  assert.match(html, /id="gantt-hide-issuer-closed"/);
  assert.match(html, /id="gantt-hide-bank-closed"/);
  assert.match(app, /ganttHourFxClosed/);
  assert.match(app, /hideFxClosedHours/);
  assert.match(app, /hidePayoutClosedHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
