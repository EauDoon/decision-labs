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
  ganttHourPayoutOpen,
  runSimulation
} from "../src/model.js";

test("payout-open helper hides hours whose payout gate is open", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourPayoutOpen(schedule.hours[0]), true);
  assert.equal(ganttHourPayoutClosed(schedule.hours[0]), false);
  assert.equal(ganttHourPayoutOpen(schedule.hours[2]), false);
  assert.equal(ganttHourPayoutClosed(schedule.hours[2]), true);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[0]), true);
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourPayoutOpen(null), false);
  assert.equal(ganttHourPayoutOpen({}), false);
  const earlyFriday = { ...DEFAULT_SCENARIO, fridayEarlyPayoutOpen: true };
  const earlySchedule = buildGateSchedule(earlyFriday);
  assert.equal(ganttHourPayoutOpen(earlySchedule.hours[3]), true);
  assert.equal(ganttHourPayoutClosed(earlySchedule.hours[3]), false);
  assert.equal(ganttHourOpenOnEveryGate(earlySchedule.hours[3]), false);
  assert.equal(ganttHourIssuerClosed(earlySchedule.hours[3]), true);
  assert.equal(ganttHourBankClosed(earlySchedule.hours[3]), true);
  assert.equal(ganttHourFxClosed(earlySchedule.hours[3]), false);
  const payoutOpen = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourPayoutOpen(point)).length;
  const payoutClosed = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourPayoutClosed(point)).length;
  assert.ok(payoutOpen > 0);
  assert.ok(payoutClosed > 0);
  assert.equal(payoutOpen + payoutClosed, SIMULATION_HOURS);
});

test("hide-payout-open Gantt SVG is display-only and keeps the selected hour visible", () => {
  const earlyFriday = { ...DEFAULT_SCENARIO, fridayEarlyPayoutOpen: true };
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const hiddenOpenPayout = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hidePayoutOpenHours: true });
  const hiddenPayoutClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hidePayoutClosedHours: true });
  const hiddenFx = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxClosedHours: true });
  const hiddenIssuer = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true });
  const hiddenBank = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankClosedHours: true });
  const splitOpen = buildGateGanttSvg(earlyFriday, 0, { hidePayoutOpenHours: true });
  const splitClosed = buildGateGanttSvg(earlyFriday, 0, { hidePayoutClosedHours: true });
  const hiddenOpen = buildGateGanttSvg(earlyFriday, 0, { hideOpenHours: true });
  const composedOpen = buildGateGanttSvg(earlyFriday, 0, { hidePayoutOpenHours: true, hideOpenHours: true });
  const hiddenClosed = buildGateGanttSvg(earlyFriday, 0, { hideClosedHours: true });
  const composedClosed = buildGateGanttSvg(earlyFriday, 0, { hidePayoutOpenHours: true, hideClosedHours: true });
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayHours: true });
  const composedWeekday = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hidePayoutOpenHours: true, hideWeekdayHours: true });
  const weekendOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  const composedWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hidePayoutOpenHours: true, hideWeekendHours: true });
  const hiddenZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true });
  const composedZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hidePayoutOpenHours: true, hideZeroQueueHours: true });
  const composedFx = buildGateGanttSvg(earlyFriday, 0, { hidePayoutOpenHours: true, hideFxClosedHours: true });
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const everyClosed = buildGateGanttSvg(holiday, 0, { everyClosedOnly: true });
  const composedEvery = buildGateGanttSvg(holiday, 0, { hidePayoutOpenHours: true, everyClosedOnly: true });
  const closedOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { closedOnly: true });
  const composedClosedOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hidePayoutOpenHours: true, closedOnly: true });
  const fxOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hidePayoutOpenHours: true, gateFilter: "fx" });
  const selectedOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hidePayoutOpenHours: true });
  const selectedClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 2, { hidePayoutOpenHours: true });
  assert.notEqual(full, hiddenOpenPayout);
  assert.notEqual(hiddenOpenPayout, hiddenPayoutClosed);
  assert.notEqual(splitOpen, splitClosed);
  assert.notEqual(splitOpen, hiddenOpen);
  assert.notEqual(hiddenOpenPayout, hiddenFx);
  assert.notEqual(hiddenOpenPayout, hiddenIssuer);
  assert.notEqual(hiddenOpenPayout, hiddenBank);
  assert.notEqual(hiddenOpenPayout, hiddenZero);
  assert.match(hiddenOpenPayout, /viewBox="0 0 720/);
  const hiddenRects = (hiddenOpenPayout.match(/<rect /g) || []).length;
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
  const composedFxRects = (composedFx.match(/<rect /g) || []).length;
  const splitFx = buildGateGanttSvg(earlyFriday, 0, { hideFxClosedHours: true });
  const splitFxRects = (splitFx.match(/<rect /g) || []).length;
  const everyRects = (everyClosed.match(/<rect /g) || []).length;
  const composedEveryRects = (composedEvery.match(/<rect /g) || []).length;
  const closedOnlyRects = (closedOnly.match(/<rect /g) || []).length;
  const composedClosedOnlyRects = (composedClosedOnly.match(/<rect /g) || []).length;
  const fxRects = (fxOnly.match(/<rect /g) || []).length;
  const selectedOpenRects = (selectedOpen.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedClosed.match(/<rect /g) || []).length;
  const hiddenPayoutClosedRects = (hiddenPayoutClosed.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(composedOpenRects < hiddenOpenRects);
  assert.ok(composedClosedRects < hiddenClosedRects);
  assert.ok(composedWeekdayRects <= weekdayRects);
  assert.ok(composedWeekendRects <= weekendRects);
  assert.ok(composedZeroRects < hiddenZeroRects);
  assert.ok(composedFxRects < splitOpenRects);
  assert.ok(composedFxRects <= splitFxRects);
  assert.ok(composedEveryRects <= everyRects);
  assert.ok(composedClosedOnlyRects < closedOnlyRects);
  assert.ok(fxRects < hiddenRects);
  assert.ok(selectedOpenRects > selectedClosedRects);
  assert.ok(hiddenRects !== hiddenPayoutClosedRects);
  assert.ok(splitOpenRects !== splitClosedRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-payout-open Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-payout-open"/);
  assert.match(html, /Hide hours where the payout gate is open/);
  assert.match(html, /id="gantt-hide-payout-closed"/);
  assert.match(html, /id="gantt-hide-fx-closed"/);
  assert.match(html, /id="gantt-hide-issuer-closed"/);
  assert.match(html, /id="gantt-hide-bank-closed"/);
  assert.match(app, /ganttHourPayoutOpen/);
  assert.match(app, /hidePayoutOpenHours/);
  assert.match(app, /hidePayoutClosedHours/);
  assert.match(app, /hideFxClosedHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
