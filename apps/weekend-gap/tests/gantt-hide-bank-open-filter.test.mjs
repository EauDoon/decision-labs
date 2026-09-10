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
  ganttHourBankOpen,
  ganttHourClosedOnEveryGate,
  ganttHourFxOpen,
  ganttHourIssuerClosed,
  ganttHourOpenOnEveryGate,
  ganttHourPayoutClosed,
  runSimulation
} from "../src/model.js";

test("bank-open helper hides hours whose bank gate is open", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourBankOpen(schedule.hours[0]), true);
  assert.equal(ganttHourBankClosed(schedule.hours[0]), false);
  assert.equal(ganttHourBankOpen(schedule.hours[2]), false);
  assert.equal(ganttHourBankClosed(schedule.hours[2]), true);
  assert.equal(ganttHourFxOpen(schedule.hours[0]), true);
  assert.equal(ganttHourBankOpen(schedule.hours[0]), true);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[0]), true);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourBankOpen(null), false);
  assert.equal(ganttHourBankOpen({}), false);
  const lateBank = { ...DEFAULT_SCENARIO, sundayLateBankClose: true };
  const lateSchedule = buildGateSchedule(lateBank);
  assert.equal(ganttHourBankOpen(lateSchedule.hours[49]), true);
  assert.equal(ganttHourBankClosed(lateSchedule.hours[49]), false);
  assert.equal(ganttHourOpenOnEveryGate(lateSchedule.hours[49]), false);
  assert.equal(ganttHourIssuerClosed(lateSchedule.hours[49]), true);
  assert.equal(ganttHourPayoutClosed(lateSchedule.hours[49]), true);
  assert.equal(ganttHourFxOpen(lateSchedule.hours[49]), false);
  const bankOpen = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourBankOpen(point)).length;
  const bankClosed = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourBankClosed(point)).length;
  assert.ok(bankOpen > 0);
  assert.ok(bankClosed > 0);
  assert.equal(bankOpen + bankClosed, SIMULATION_HOURS);
});

test("hide-bank-open Gantt SVG is display-only and keeps the selected hour visible", () => {
  const lateBank = { ...DEFAULT_SCENARIO, sundayLateBankClose: true };
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const hiddenOpenBank = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankOpenHours: true });
  const hiddenBankClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankClosedHours: true });
  const hiddenFxOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxOpenHours: true });
  const hiddenIssuer = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true });
  const splitOpen = buildGateGanttSvg(lateBank, 0, { hideBankOpenHours: true });
  const splitClosed = buildGateGanttSvg(lateBank, 0, { hideBankClosedHours: true });
  const hiddenOpen = buildGateGanttSvg(lateBank, 0, { hideOpenHours: true });
  const composedOpen = buildGateGanttSvg(lateBank, 0, { hideBankOpenHours: true, hideOpenHours: true });
  const hiddenClosed = buildGateGanttSvg(lateBank, 0, { hideClosedHours: true });
  const composedClosed = buildGateGanttSvg(lateBank, 0, { hideBankOpenHours: true, hideClosedHours: true });
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayHours: true });
  const composedWeekday = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankOpenHours: true, hideWeekdayHours: true });
  const weekendOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  const composedWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankOpenHours: true, hideWeekendHours: true });
  const hiddenZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true });
  const composedZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankOpenHours: true, hideZeroQueueHours: true });
  const composedBankClosed = buildGateGanttSvg(lateBank, 0, { hideBankOpenHours: true, hideBankClosedHours: true });
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const everyClosed = buildGateGanttSvg(holiday, 0, { everyClosedOnly: true });
  const composedEvery = buildGateGanttSvg(holiday, 0, { hideBankOpenHours: true, everyClosedOnly: true });
  const closedOnly = buildGateGanttSvg(lateBank, 0, { closedOnly: true });
  const composedClosedOnly = buildGateGanttSvg(lateBank, 0, { hideBankOpenHours: true, closedOnly: true });
  const payoutOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankOpenHours: true, gateFilter: "payout" });
  const selectedOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankOpenHours: true });
  const selectedClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 2, { hideBankOpenHours: true });
  assert.notEqual(full, hiddenOpenBank);
  assert.notEqual(hiddenOpenBank, hiddenBankClosed);
  assert.notEqual(splitOpen, splitClosed);
  assert.notEqual(splitOpen, hiddenOpen);
  assert.notEqual(hiddenOpenBank, hiddenFxOpen);
  assert.notEqual(hiddenOpenBank, hiddenIssuer);
  assert.notEqual(hiddenOpenBank, hiddenZero);
  assert.match(hiddenOpenBank, /viewBox="0 0 720/);
  const hiddenRects = (hiddenOpenBank.match(/<rect /g) || []).length;
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
  const composedBankClosedRects = (composedBankClosed.match(/<rect /g) || []).length;
  const splitFx = buildGateGanttSvg(lateBank, 0, { hideFxOpenHours: true });
  const splitFxRects = (splitFx.match(/<rect /g) || []).length;
  const everyRects = (everyClosed.match(/<rect /g) || []).length;
  const composedEveryRects = (composedEvery.match(/<rect /g) || []).length;
  const closedOnlyRects = (closedOnly.match(/<rect /g) || []).length;
  const composedClosedOnlyRects = (composedClosedOnly.match(/<rect /g) || []).length;
  const payoutRects = (payoutOnly.match(/<rect /g) || []).length;
  const selectedOpenRects = (selectedOpen.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedClosed.match(/<rect /g) || []).length;
  const hiddenBankClosedRects = (hiddenBankClosed.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(composedOpenRects < hiddenOpenRects);
  assert.ok(composedClosedRects < hiddenClosedRects);
  assert.ok(composedWeekdayRects <= weekdayRects);
  assert.ok(composedWeekendRects <= weekendRects);
  assert.ok(composedZeroRects < hiddenZeroRects);
  assert.ok(composedBankClosedRects < splitOpenRects);
  assert.ok(composedBankClosedRects <= splitClosedRects);
  assert.ok(splitOpenRects !== splitFxRects);
  assert.ok(composedEveryRects <= everyRects);
  assert.ok(composedClosedOnlyRects < closedOnlyRects);
  assert.ok(payoutRects < hiddenRects);
  assert.ok(selectedOpenRects > selectedClosedRects);
  assert.ok(hiddenRects !== hiddenBankClosedRects);
  assert.ok(splitOpenRects !== splitClosedRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-bank-open Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-bank-open"/);
  assert.match(html, /Hide hours where the bank gate is open/);
  assert.match(html, /id="gantt-hide-bank-closed"/);
  assert.match(html, /id="gantt-hide-fx-open"/);
  assert.match(html, /id="gantt-hide-issuer-closed"/);
  assert.match(app, /ganttHourBankOpen/);
  assert.match(app, /hideBankOpenHours/);
  assert.match(app, /hideBankClosedHours/);
  assert.match(app, /hideFxOpenHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
