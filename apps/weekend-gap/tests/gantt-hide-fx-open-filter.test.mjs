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
  ganttHourFxOpen,
  ganttHourIssuerClosed,
  ganttHourOpenOnEveryGate,
  ganttHourPayoutClosed,
  ganttHourPayoutOpen,
  runSimulation
} from "../src/model.js";

test("FX-open helper hides hours whose FX gate is weekday depth", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourFxOpen(schedule.hours[0]), true);
  assert.equal(ganttHourFxClosed(schedule.hours[0]), false);
  assert.equal(ganttHourFxOpen(schedule.hours[9]), false);
  assert.equal(ganttHourFxClosed(schedule.hours[9]), true);
  assert.equal(ganttHourPayoutClosed(schedule.hours[2]), true);
  assert.equal(ganttHourFxOpen(schedule.hours[2]), true);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[0]), true);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourFxOpen(null), false);
  assert.equal(ganttHourFxOpen({}), false);
  const earlyFx = { ...DEFAULT_SCENARIO, saturdayEarlyFxOpen: true };
  const earlySchedule = buildGateSchedule(earlyFx);
  assert.equal(ganttHourFxOpen(earlySchedule.hours[15]), true);
  assert.equal(ganttHourFxClosed(earlySchedule.hours[15]), false);
  assert.equal(ganttHourOpenOnEveryGate(earlySchedule.hours[15]), false);
  assert.equal(ganttHourIssuerClosed(earlySchedule.hours[15]), true);
  assert.equal(ganttHourBankClosed(earlySchedule.hours[15]), true);
  assert.equal(ganttHourPayoutClosed(earlySchedule.hours[15]), true);
  assert.equal(ganttHourPayoutOpen(earlySchedule.hours[15]), false);
  const fxOpen = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourFxOpen(point)).length;
  const fxClosed = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourFxClosed(point)).length;
  assert.ok(fxOpen > 0);
  assert.ok(fxClosed > 0);
  assert.equal(fxOpen + fxClosed, SIMULATION_HOURS);
});

test("hide-FX-open Gantt SVG is display-only and keeps the selected hour visible", () => {
  const earlyFx = { ...DEFAULT_SCENARIO, saturdayEarlyFxOpen: true };
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const hiddenOpenFx = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxOpenHours: true });
  const hiddenFxClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxClosedHours: true });
  const hiddenPayoutOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hidePayoutOpenHours: true });
  const hiddenIssuer = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true });
  const hiddenBank = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankClosedHours: true });
  const splitOpen = buildGateGanttSvg(earlyFx, 0, { hideFxOpenHours: true });
  const splitClosed = buildGateGanttSvg(earlyFx, 0, { hideFxClosedHours: true });
  const hiddenOpen = buildGateGanttSvg(earlyFx, 0, { hideOpenHours: true });
  const composedOpen = buildGateGanttSvg(earlyFx, 0, { hideFxOpenHours: true, hideOpenHours: true });
  const hiddenClosed = buildGateGanttSvg(earlyFx, 0, { hideClosedHours: true });
  const composedClosed = buildGateGanttSvg(earlyFx, 0, { hideFxOpenHours: true, hideClosedHours: true });
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayHours: true });
  const composedWeekday = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxOpenHours: true, hideWeekdayHours: true });
  const weekendOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  const composedWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxOpenHours: true, hideWeekendHours: true });
  const hiddenZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true });
  const composedZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxOpenHours: true, hideZeroQueueHours: true });
  const composedFxClosed = buildGateGanttSvg(earlyFx, 0, { hideFxOpenHours: true, hideFxClosedHours: true });
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const everyClosed = buildGateGanttSvg(holiday, 0, { everyClosedOnly: true });
  const composedEvery = buildGateGanttSvg(holiday, 0, { hideFxOpenHours: true, everyClosedOnly: true });
  const closedOnly = buildGateGanttSvg(earlyFx, 0, { closedOnly: true });
  const composedClosedOnly = buildGateGanttSvg(earlyFx, 0, { hideFxOpenHours: true, closedOnly: true });
  const payoutOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxOpenHours: true, gateFilter: "payout" });
  const selectedOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxOpenHours: true });
  const selectedClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 9, { hideFxOpenHours: true });
  assert.notEqual(full, hiddenOpenFx);
  assert.notEqual(hiddenOpenFx, hiddenFxClosed);
  assert.notEqual(splitOpen, splitClosed);
  assert.notEqual(splitOpen, hiddenOpen);
  assert.notEqual(hiddenOpenFx, hiddenPayoutOpen);
  assert.notEqual(hiddenOpenFx, hiddenIssuer);
  assert.notEqual(hiddenOpenFx, hiddenBank);
  assert.notEqual(hiddenOpenFx, hiddenZero);
  assert.match(hiddenOpenFx, /viewBox="0 0 720/);
  const hiddenRects = (hiddenOpenFx.match(/<rect /g) || []).length;
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
  const splitOpenRects = (splitOpen.match(/<rect /g) || []).length;
  const splitClosedRects = (splitClosed.match(/<rect /g) || []).length;
  const composedFxClosedRects = (composedFxClosed.match(/<rect /g) || []).length;
  const splitPayout = buildGateGanttSvg(earlyFx, 0, { hidePayoutOpenHours: true });
  const splitPayoutRects = (splitPayout.match(/<rect /g) || []).length;
  const everyRects = (everyClosed.match(/<rect /g) || []).length;
  const composedEveryRects = (composedEvery.match(/<rect /g) || []).length;
  const closedOnlyRects = (closedOnly.match(/<rect /g) || []).length;
  const composedClosedOnlyRects = (composedClosedOnly.match(/<rect /g) || []).length;
  const payoutRects = (payoutOnly.match(/<rect /g) || []).length;
  const selectedOpenRects = (selectedOpen.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedClosed.match(/<rect /g) || []).length;
  const hiddenFxClosedRects = (hiddenFxClosed.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(composedOpenRects < hiddenOpenRects);
  assert.ok(composedClosedRects < hiddenClosedRects);
  assert.ok(composedWeekdayRects <= weekdayRects);
  assert.ok(composedWeekendRects <= weekendRects);
  assert.ok(composedZeroRects < hiddenZeroRects);
  assert.ok(composedFxClosedRects < splitOpenRects);
  assert.ok(composedFxClosedRects <= splitClosedRects);
  assert.ok(splitOpenRects !== splitPayoutRects);
  assert.ok(composedEveryRects <= everyRects);
  assert.ok(composedClosedOnlyRects < closedOnlyRects);
  assert.ok(payoutRects < hiddenRects);
  assert.ok(selectedOpenRects > selectedClosedRects);
  assert.ok(hiddenRects !== hiddenFxClosedRects);
  assert.ok(splitOpenRects !== splitClosedRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-FX-open Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-fx-open"/);
  assert.match(html, /Hide hours where the FX gate is open/);
  assert.match(html, /id="gantt-hide-fx-closed"/);
  assert.match(html, /id="gantt-hide-payout-open"/);
  assert.match(html, /id="gantt-hide-issuer-closed"/);
  assert.match(html, /id="gantt-hide-bank-closed"/);
  assert.match(app, /ganttHourFxOpen/);
  assert.match(app, /hideFxOpenHours/);
  assert.match(app, /hideFxClosedHours/);
  assert.match(app, /hidePayoutOpenHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
